// src/app/dashboard/DailyRouteMap.tsx
'use client';

import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Route, Clock } from 'lucide-react';

// --- Interfaces ---
interface PlannedVisit {
  id: number;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
}

interface DailyRouteMapProps {
  plannedVisits: PlannedVisit[];
}

// --- Helper component for the user's live location ---
function CurrentPositionMarker() {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Get the user's location once initially
    navigator.geolocation.getCurrentPosition((pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });

    // Then watch for changes
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
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

// --- Helper component to draw the route and display info ---
function Directions({ visits }: { visits: PlannedVisit[] }) {
  const map = useMap();
  const [route, setRoute] = useState<google.maps.DirectionsRoute | null>(null);

  useEffect(() => {
    if (!map || visits.length < 2) return;

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#1d4ed8', strokeWeight: 6 },
    });
    directionsRenderer.setMap(map);

    const origin = { lat: visits[0].latitude!, lng: visits[0].longitude! };
    const destination = { lat: visits[visits.length - 1].latitude!, lng: visits[visits.length - 1].longitude! };
    const waypoints = visits.slice(1, -1).map(v => ({ location: { lat: v.latitude!, lng: v.longitude! }, stopover: true }));

    directionsService.route({
        origin, destination, waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
    }, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRenderer.setDirections(result);
            setRoute(result.routes[0]);
        }
    });

    return () => { directionsRenderer.setMap(null); };
  }, [map, visits]);

  if (!route) return null;

  const totalDistance = route.legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0);
  const totalDuration = route.legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0);

  const formatDistance = (meters: number) => `${(meters / 1000).toFixed(1)} km`;
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-10">
      <h4 className="font-bold text-sm">Route Summary</h4>
      <div className="flex items-center text-xs mt-1">
        <Route className="h-4 w-4 mr-2 text-gray-500" />
        <span>Total Distance: <strong>{formatDistance(totalDistance)}</strong></span>
      </div>
      <div className="flex items-center text-xs mt-1">
        <Clock className="h-4 w-4 mr-2 text-gray-500" />
        <span>Est. Travel Time: <strong>{formatDuration(totalDuration)}</strong></span>
      </div>
    </div>
  );
}

// --- Main Component ---
export function DailyRouteMap({ plannedVisits }: DailyRouteMapProps) {
  const validVisits = plannedVisits.filter(v => v.latitude != null && v.longitude != null);

  if (validVisits.length === 0) {
    return <div className="h-80 bg-gray-200 rounded-lg flex items-center justify-center"><p>No locations with coordinates in today's plan.</p></div>;
  }

  // Set the initial map center to the first planned visit
  const initialCenter = { lat: validVisits[0].latitude!, lng: validVisits[0].longitude! };

  return (
    <div className="h-80 w-full rounded-lg overflow-hidden relative">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} libraries={['routes']}>
        <Map
          defaultCenter={initialCenter}
          defaultZoom={12}
          mapId="gph-executive-map"
          gestureHandling={'greedy'}
          disableDefaultUI={false} // Enable zoom/pan controls
        >
          <CurrentPositionMarker />
          <Directions visits={validVisits} />

          {validVisits.map(visit => (
            <AdvancedMarker
              key={visit.id}
              position={{ lat: visit.latitude!, lng: visit.longitude! }}
              title={visit.locationName}
            >
              <Pin />
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}