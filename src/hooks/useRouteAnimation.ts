// src/hooks/useRouteAnimation.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  isPredicted?: boolean;
}

interface AnimationState {
  currentIndex: number;
  progress: number; // 0 to 100
  isPlaying: boolean;
  currentPosition: { lat: number; lng: number } | null;
  currentBearing: number; // rotation angle in degrees
  visibleSegments: { path: { lat: number; lng: number }[]; isPredicted: boolean }[];
}

interface UseRouteAnimationProps {
  path: LocationPoint[];
  speed: number; // multiplier (0.5x, 1x, 2x, 3x)
  onComplete?: () => void;
}

export function useRouteAnimation({ path, speed, onComplete }: UseRouteAnimationProps) {
  const [state, setState] = useState<AnimationState>({
    currentIndex: 0,
    progress: 0,
    isPlaying: false,
    currentPosition: null,
    currentBearing: 0,
    visibleSegments: [],
  });

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number>(0);

  // Calculate total animation duration in milliseconds
  // Default: 60 seconds (1 minute) at 1x speed
  const baseDuration = 60000; // 60 seconds
  const animationDuration = baseDuration / speed;

  // Calculate bearing (direction) between two points
  const calculateBearing = useCallback((start: { lat: number; lng: number }, end: { lat: number; lng: number }): number => {
    const startLat = (start.lat * Math.PI) / 180;
    const startLng = (start.lng * Math.PI) / 180;
    const endLat = (end.lat * Math.PI) / 180;
    const endLng = (end.lng * Math.PI) / 180;

    const dLng = endLng - startLng;
    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360; // normalize to 0-360
  }, []);

  // Interpolate position between two points
  const interpolatePosition = useCallback((
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    fraction: number
  ): { lat: number; lng: number } => {
    return {
      lat: start.lat + (end.lat - start.lat) * fraction,
      lng: start.lng + (end.lng - start.lng) * fraction,
    };
  }, []);

  // Build visible segments up to current position
  const buildVisibleSegments = useCallback((currentIdx: number, interpolatedPos: { lat: number; lng: number }) => {
    const segments: { path: { lat: number; lng: number }[]; isPredicted: boolean }[] = [];
    let currentSegment: { path: { lat: number; lng: number }[]; isPredicted: boolean } | null = null;

    // Add all complete points up to currentIdx
    for (let i = 0; i <= currentIdx; i++) {
      const point = path[i];
      const isPredicted = point.isPredicted || false;

      if (!currentSegment || currentSegment.isPredicted !== isPredicted) {
        if (currentSegment) {
          segments.push(currentSegment);
        }
        currentSegment = { path: [], isPredicted };

        // Add last point from previous segment for continuity
        if (segments.length > 0) {
          const lastSegment = segments[segments.length - 1];
          const lastPoint = lastSegment.path[lastSegment.path.length - 1];
          if (lastPoint) {
            currentSegment.path.push(lastPoint);
          }
        }
      }

      currentSegment.path.push({ lat: point.latitude, lng: point.longitude });
    }

    // Add interpolated position to current segment
    if (currentSegment && currentIdx < path.length - 1) {
      currentSegment.path.push(interpolatedPos);
    }

    if (currentSegment) {
      segments.push(currentSegment);
    }

    return segments;
  }, [path]);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp - pausedAtRef.current;
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min((elapsed / animationDuration) * 100, 100);

    // Calculate which point we should be at
    const targetIndex = Math.floor((progress / 100) * (path.length - 1));
    const nextIndex = Math.min(targetIndex + 1, path.length - 1);

    // Calculate interpolation fraction between current and next point
    const segmentProgress = ((progress / 100) * (path.length - 1)) % 1;

    if (targetIndex >= path.length - 1) {
      // Animation complete
      const lastPoint = path[path.length - 1];
      setState({
        currentIndex: path.length - 1,
        progress: 100,
        isPlaying: false,
        currentPosition: { lat: lastPoint.latitude, lng: lastPoint.longitude },
        currentBearing: state.currentBearing,
        visibleSegments: buildVisibleSegments(path.length - 1, { lat: lastPoint.latitude, lng: lastPoint.longitude }),
      });
      onComplete?.();
      return;
    }

    const currentPoint = path[targetIndex];
    const nextPoint = path[nextIndex];

    const start = { lat: currentPoint.latitude, lng: currentPoint.longitude };
    const end = { lat: nextPoint.latitude, lng: nextPoint.longitude };

    const interpolatedPos = interpolatePosition(start, end, segmentProgress);
    const bearing = calculateBearing(start, end);
    const visibleSegs = buildVisibleSegments(targetIndex, interpolatedPos);

    setState({
      currentIndex: targetIndex,
      progress,
      isPlaying: true,
      currentPosition: interpolatedPos,
      currentBearing: bearing,
      visibleSegments: visibleSegs,
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [path, animationDuration, calculateBearing, interpolatePosition, buildVisibleSegments, onComplete, state.currentBearing]);

  // Play function
  const play = useCallback(() => {
    if (path.length < 2) return;

    setState(prev => ({ ...prev, isPlaying: true }));
    startTimeRef.current = null;
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [path, animate]);

  // Pause function
  const pause = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Store how far we've progressed
    pausedAtRef.current = (state.progress / 100) * animationDuration;

    setState(prev => ({ ...prev, isPlaying: false }));
  }, [state.progress, animationDuration]);

  // Reset function
  const reset = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    startTimeRef.current = null;
    pausedAtRef.current = 0;

    const firstPoint = path[0];
    setState({
      currentIndex: 0,
      progress: 0,
      isPlaying: false,
      currentPosition: firstPoint ? { lat: firstPoint.latitude, lng: firstPoint.longitude } : null,
      currentBearing: 0,
      visibleSegments: [],
    });
  }, [path]);

  // Seek to specific progress (0-100)
  const seekTo = useCallback((targetProgress: number) => {
    const wasPlaying = state.isPlaying;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const clampedProgress = Math.max(0, Math.min(100, targetProgress));
    pausedAtRef.current = (clampedProgress / 100) * animationDuration;

    const targetIndex = Math.floor((clampedProgress / 100) * (path.length - 1));
    const nextIndex = Math.min(targetIndex + 1, path.length - 1);
    const segmentProgress = ((clampedProgress / 100) * (path.length - 1)) % 1;

    const currentPoint = path[targetIndex];
    const nextPoint = path[nextIndex];

    const start = { lat: currentPoint.latitude, lng: currentPoint.longitude };
    const end = { lat: nextPoint.latitude, lng: nextPoint.longitude };

    const interpolatedPos = interpolatePosition(start, end, segmentProgress);
    const bearing = calculateBearing(start, end);
    const visibleSegs = buildVisibleSegments(targetIndex, interpolatedPos);

    setState({
      currentIndex: targetIndex,
      progress: clampedProgress,
      isPlaying: false,
      currentPosition: interpolatedPos,
      currentBearing: bearing,
      visibleSegments: visibleSegs,
    });

    // Resume playing if it was playing before seek
    if (wasPlaying) {
      startTimeRef.current = null;
      animationFrameRef.current = requestAnimationFrame(animate);
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  }, [path, state.isPlaying, animationDuration, interpolatePosition, calculateBearing, buildVisibleSegments, animate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle speed changes
  useEffect(() => {
    if (state.isPlaying) {
      // Recalculate pausedAt for new speed
      pausedAtRef.current = (state.progress / 100) * animationDuration;
      startTimeRef.current = null;
    }
  }, [speed, animationDuration, state.progress, state.isPlaying]);

  return {
    ...state,
    play,
    pause,
    reset,
    seekTo,
  };
}
