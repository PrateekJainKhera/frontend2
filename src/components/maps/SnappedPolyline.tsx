// src/components/maps/SnappedPolyline.tsx
'use client';

import { useState, useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface SnappedPolylineProps {
  rawPath: { lat: number; lng: number }[];
}

export function SnappedPolyline({ rawPath }: SnappedPolylineProps) {
  const map = useMap();
  const [snappedPath, setSnappedPath] = useState<{ lat: number; lng: number }[]>([]);

  useEffect(() => {
    if (!map || rawPath.length < 2) return;

    const fetchSnappedPoints = async () => {
      let allSnappedPoints: { lat: number; lng: number }[] = [];
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const pathChunks = [];
      for (let i = 0; i < rawPath.length; i += 100) {
        pathChunks.push(rawPath.slice(i, i + 100));
      }

      for (const chunk of pathChunks) {
        const pathString = chunk.map(p => `${p.lat},${p.lng}`).join('|');
        const url = `https://roads.googleapis.com/v1/snapToRoads?path=${pathString}&interpolate=true&key=${apiKey}`;
        
        try {
          const response = await fetch(url);
          const data = await response.json();
          if (data.snappedPoints) {
            const points = data.snappedPoints.map((p: any) => ({
              lat: p.location.latitude,
              lng: p.location.longitude,
            }));
            allSnappedPoints.push(...points);
          }
        } catch (error) {
          console.error("Snap to Road API failed:", error);
          setSnappedPath(rawPath); // Fallback to raw path on error
          return;
        }
      }
      setSnappedPath(allSnappedPoints);
    };

    fetchSnappedPoints();
  }, [map, rawPath]);

  useEffect(() => {
    if (!map || snappedPath.length === 0) return;
    
    const polyline = new google.maps.Polyline({
      path: snappedPath, strokeColor: "#1d4ed8", strokeOpacity: 0.8, strokeWeight: 6,
    });
    polyline.setMap(map);

    return () => { polyline.setMap(null); };
  }, [map, snappedPath]);

  return null;
}