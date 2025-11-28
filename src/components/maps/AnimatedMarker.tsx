// src/components/maps/AnimatedMarker.tsx
'use client';

import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { Navigation } from 'lucide-react';

interface AnimatedMarkerProps {
  position: { lat: number; lng: number };
  bearing: number; // rotation angle in degrees
  isPredicted?: boolean; // different appearance for predicted segments
}

export function AnimatedMarker({ position, bearing, isPredicted = false }: AnimatedMarkerProps) {
  return (
    <AdvancedMarker position={position} title="Current Position">
      <div
        className="relative transition-transform duration-200"
        style={{
          transform: `rotate(${bearing}deg)`,
        }}
      >
        {/* Outer glow/pulse effect */}
        <div
          className={`absolute inset-0 rounded-full animate-ping ${
            isPredicted ? 'bg-blue-300' : 'bg-blue-500'
          }`}
          style={{
            width: '24px',
            height: '24px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.4,
          }}
        />

        {/* Main marker icon */}
        <div
          className={`relative rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
            isPredicted ? 'bg-blue-300' : 'bg-blue-600'
          }`}
          style={{
            width: '32px',
            height: '32px',
          }}
        >
          <Navigation className="h-5 w-5 text-white" fill="white" />
        </div>

        {/* Direction indicator (small triangle pointing forward) */}
        <div
          className={`absolute ${isPredicted ? 'bg-blue-300' : 'bg-blue-600'}`}
          style={{
            width: '0',
            height: '0',
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderBottom: isPredicted ? '8px solid #93c5fd' : '8px solid #2563eb',
            top: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      </div>
    </AdvancedMarker>
  );
}
