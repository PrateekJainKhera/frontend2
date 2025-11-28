// src/components/maps/SharedMapCanvas.tsx
'use client';

import { useEffect, useState } from 'react';
import { APIProvider, Map, useMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import { NumberedMarker } from '@/app/dashboard/route-plan/NumberedMarker';
import { Flag, FlagOff } from 'lucide-react';
import { AnimatedMarker } from './AnimatedMarker';

// --- Interfaces ---
interface MapMarkerData {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
    status: number; // We'll use this for the icon

}
interface RouteSegment {
  path: { lat: number; lng: number }[];
  isPredicted: boolean;
}

interface SharedMapCanvasProps {
  segments?: RouteSegment[]; // <-- NEW PROP
  
  markers?: MapMarkerData[];
  showLiveLocation?: boolean;
  snapToRoad?: boolean; // DEPRECATED: Backend now handles snapping
  endTime?: string | null;
  // Animation props
  animationMode?: boolean;
  animatedPosition?: { lat: number; lng: number } | null;
  animatedBearing?: number;
  isPredictedSegment?: boolean;
  cameraFollow?: boolean;
}

// --- Helper Components ---

function CurrentPositionMarker() {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);
  return position ? (
    <AdvancedMarker position={position} title="Your Location">
      <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
    </AdvancedMarker>
  ) : null;
}
function RouteRenderer({
  segments,
  markers,
  animationMode,
  cameraFollow,
  animatedPosition
}: {
  segments?: RouteSegment[],
  markers?: MapMarkerData[],
  animationMode?: boolean,
  cameraFollow?: boolean,
  animatedPosition?: { lat: number; lng: number } | null
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || (!segments && !markers)) return;

    const bounds = new google.maps.LatLngBounds();
    const polylines: google.maps.Polyline[] = [];

    // --- THIS IS THE CORE LOGIC ---
    // Iterate over each segment and create a polyline with the correct style.
    segments?.forEach(segment => {
      // Define the style for a dashed line (for predicted routes)
      const dashedLineSymbol = {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        scale: 4,
      };

      const polyline = new google.maps.Polyline({
        path: segment.path,
        strokeColor: segment.isPredicted ? "#5a95f5" : "#1d4ed8", // Lighter blue for predicted
        strokeWeight: segment.isPredicted ? 5 : 6,
        strokeOpacity: segment.isPredicted ? 0 : 1, // Solid line has opacity, dashed does not
        // Apply the dashed style ONLY if the segment is predicted
        icons: segment.isPredicted ? [{
          icon: dashedLineSymbol,
          offset: '0',
          repeat: '20px'
        }] : undefined,
      });

      polyline.setMap(map);
      polylines.push(polyline);

      // Extend the map bounds to include all points from this segment
      segment.path.forEach(point => bounds.extend(point));
    });

    // Also extend bounds to include any visit markers
    markers?.forEach(marker => bounds.extend({ lat: marker.latitude, lng: marker.longitude }));

    // In animation mode, only fit bounds if not following camera and no animated position yet
    if (!animationMode || !cameraFollow) {
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 100); // 100px padding
      }
    }

    // Cleanup function to remove polylines when the component unmounts
    return () => {
      polylines.forEach(p => p.setMap(null));
    };
  }, [map, segments, markers, animationMode, cameraFollow]);

  // Camera follow effect
  useEffect(() => {
    if (!map || !animationMode || !cameraFollow || !animatedPosition) return;

    map.panTo(animatedPosition);
    map.setZoom(15); // Closer zoom when following
  }, [map, animationMode, cameraFollow, animatedPosition]);

  return null; // This component does not render any visible JSX itself
}

// --- Main Reusable Component ---
export function SharedMapCanvas({
  segments,
  markers,
  showLiveLocation = false,
  endTime,
  animationMode = false,
  animatedPosition = null,
  animatedBearing = 0,
  isPredictedSegment = false,
  cameraFollow = true
}: SharedMapCanvasProps) {
  const defaultCenter = markers?.[0]
    ? { lat: markers[0].latitude, lng: markers[0].longitude }
    : { lat: 22.7196, lng: 75.8577 };

 const startPoint = segments && segments.length > 0 ? segments[0].path[0] : null;
  const lastSegment = segments && segments.length > 0 ? segments[segments.length - 1] : null;
  const endPoint = lastSegment && lastSegment.path.length > 0 ? lastSegment.path[lastSegment.path.length - 1] : null;

  // Removed: useState and useEffect for frontend snapping
  // The path from backend is already optimized
  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} libraries={['routes', 'geometry']}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={12}
          mapId="gph-shared-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          <RouteRenderer
            segments={segments}
            markers={markers}
            animationMode={animationMode}
            cameraFollow={cameraFollow}
            animatedPosition={animatedPosition}
          />

          {showLiveLocation && <CurrentPositionMarker />}

        {/* Render Start Marker (Always show if path exists) */}
          {startPoint && !showLiveLocation && !animationMode && (
            <AdvancedMarker position={startPoint} title="Start of Day">
              <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg">
                <Flag className="h-4 w-4" />
              </div>
            </AdvancedMarker>
          )}

          {/* Animated Marker (only in animation mode) */}
          {animationMode && animatedPosition && (
            <AnimatedMarker
              position={animatedPosition}
              bearing={animatedBearing}
              isPredicted={isPredictedSegment}
            />
          )}

          {/* Render Numbered Visit Markers */}
          {markers?.map((marker, index) => (
            <AdvancedMarker
              key={`${marker.id}-${index}`} // <-- THIS IS THE FIX
              position={{ lat: marker.latitude, lng: marker.longitude }}
              title={`${index + 1}. ${marker.name}`}
            >
              <NumberedMarker number={index + 1} />
            </AdvancedMarker>
          ))}

          {/* 2. Conditionally Render End Marker */}
          {/* Only show the end flag if the path exists AND endTime is not null AND not in animation mode */}
          {endPoint && !showLiveLocation && endTime && !animationMode && (
            <AdvancedMarker position={endPoint} title="End of Day">
              <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg">
                <FlagOff className="h-4 w-4" />
              </div>
            </AdvancedMarker>
          )}

          {/* --- END OF UPDATED MARKER LOGIC --- */}

        </Map>
      </APIProvider>
    </div>
  );
}