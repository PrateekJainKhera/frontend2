// src/app/dashboard/route-plan/NumberedMarker.tsx
'use client';

import { Pin } from '@vis.gl/react-google-maps';

interface NumberedMarkerProps {
  number: number;
}

export function NumberedMarker({ number }: NumberedMarkerProps) {
  return (
    <Pin
      background={'#1d4ed8'} // Blue background
      borderColor={'#60a5fa'}
      glyphColor={'#ffffff'}
      scale={1.2} // Make it slightly larger
    >
      {/* The number is placed inside the Pin component */}
      <span className="text-white font-bold text-sm">{number}</span>
    </Pin>
  );
}