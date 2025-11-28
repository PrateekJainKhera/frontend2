// src/app/dashboard/route-plan/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Navigation, PlayCircle, Route as RouteIcon, Clock, CheckCircle2, Check } from 'lucide-react';
import api from '@/services/api';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext'; // ADD THIS
import { useRouter } from 'next/navigation';
import { NumberedMarker } from './NumberedMarker';

// --- Interfaces ---
interface PlannedVisit {
  locationType: any;
  id: number;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  status: number;
}

// --- Helper component to draw the route ---
function DirectionsRenderer({ visits, currentPosition, onRouteCalculated }: {
  visits: PlannedVisit[],
  currentPosition: { lat: number; lng: number },
  onRouteCalculated: (route: google.maps.DirectionsResult) => void
}) {
  const map = useMap();
  useEffect(() => {
    if (!map || visits.length < 1) return;
    const directionsService = new google.maps.DirectionsService();
    const renderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#1d4ed8', strokeWeight: 6 },
    });
    renderer.setMap(map);
    const waypoints = visits.map(v => ({ location: { lat: v.latitude!, lng: v.longitude! }, stopover: true }));
    directionsService.route({
      origin: currentPosition,
      destination: currentPosition,
      waypoints: waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true,
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        renderer.setDirections(result);
        onRouteCalculated(result);
      }
    });
    return () => { renderer.setMap(null); };
  }, [map, visits, currentPosition, onRouteCalculated]);
  return null;
}

export default function RoutePlanPage() {
  const { user } = useAuthContext();
  const { t } = useLanguage(); // ADD THIS
  const router = useRouter();
  const [plannedVisits, setPlannedVisits] = useState<PlannedVisit[]>([]);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [optimizedOrder, setOptimizedOrder] = useState<PlannedVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/executives/${user.id}/beatplan`, { params: { planDate: today } });
      setPlannedVisits(response.data.filter((v: PlannedVisit) => v.latitude && v.longitude));
    } catch (error) { console.error("Failed to fetch plan", error); }
    finally { setIsLoading(false); }
  }, [user]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
    fetchPlan();
  }, [user, fetchPlan]);

  const handleRouteCalculated = useCallback((routeResult: google.maps.DirectionsResult) => {
    if (routeResult) {
      const optimized = routeResult.routes[0].waypoint_order.map(i => plannedVisits[i]);
      setOptimizedOrder(optimized);
      setDirections(routeResult);
    }
  }, [plannedVisits]);

  const handleNavigate = (visit: PlannedVisit) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${visit.latitude},${visit.longitude}`;
    window.open(url, '_blank');
  };

  const totalDistance = directions?.routes[0].legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0) || 0;
  const totalDuration = directions?.routes[0].legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0) || 0;

  if (isLoading) return <div className="p-4">{t('route.loading')}</div>;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" /> 
        {t('common.back')}
      </Button>
      
      <h2 className="text-3xl font-bold">{t('route.title')}</h2>

      <Card>
        <CardContent className="p-2 h-80 w-full">
          <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} libraries={['routes']}>
            <Map defaultCenter={currentPosition || { lat: 22.7196, lng: 75.8577 }} defaultZoom={12} mapId="gph-route-plan-map" gestureHandling="greedy">
              {currentPosition && plannedVisits.length > 0 && (
                <DirectionsRenderer visits={plannedVisits} currentPosition={currentPosition} onRouteCalculated={handleRouteCalculated} />
              )}
              {currentPosition && (
                <AdvancedMarker position={currentPosition} title={t('route.yourLocation')}>
                  <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg" />
                </AdvancedMarker>
              )}
              
              {optimizedOrder.map((visit, index) => {
                const isCompleted = visit.status === 3;
                return (
                  <AdvancedMarker
                    key={visit.id}
                    position={{ lat: visit.latitude!, lng: visit.longitude! }}
                    title={`${index + 1}. ${visit.locationName}`}
                  >
                    {isCompleted ? (
                      <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg">
                        <Check className="h-5 w-5" />
                      </div>
                    ) : (
                      <NumberedMarker number={index + 1} />
                    )}
                  </AdvancedMarker>
                );
              })}
            </Map>
          </APIProvider>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('route.summary')}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-around">
          <div className="text-center">
            <p className="text-3xl font-bold">{(totalDistance / 1000).toFixed(1)} km</p>
            <p className="text-base mt-1">{t('route.totalDistance')}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">
              {Math.floor(totalDuration / 3600)}h {Math.floor((totalDuration % 3600) / 60)}m
            </p>
            <p className="text-base mt-1">{t('route.travelTime')}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-2xl font-semibold">{t('route.itinerary')}</h3>
        {optimizedOrder.map((visit, index) => {
          const isCompleted = visit.status === 3;
          return (
            <Card key={visit.id} className={isCompleted ? 'bg-green-50 border-green-200' : ''}>
              <CardContent className="p-5 flex items-center gap-4">
                {isCompleted ? (
                  <CheckCircle2 className="h-10 w-10 text-green-500 flex-shrink-0" />
                ) : (
                  <div className="text-4xl font-bold text-gray-400 flex-shrink-0">{index + 1}</div>
                )}
                <div className="flex-1">
                  <p className={`font-semibold text-lg ${isCompleted ? 'text-gray-500 line-through' : ''}`}>
                    {visit.locationName}
                  </p>
                  {!isCompleted && (
                    <p className="text-sm text-gray-500">
                      {t('route.estimatedTravel')}: {directions?.routes[0].legs[index]?.duration?.text || 'N/A'}
                    </p>
                  )}
                </div>
                {!isCompleted && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" size="lg" onClick={() => handleNavigate(visit)} className="h-12">
                      <Navigation className="h-5 w-5 mr-2" />
                      {t('route.navigate')}
                    </Button>
                    <Button size="lg" onClick={() => router.push(`/dashboard/visit/${visit.id}?locationType=${visit.locationType}`)} className="h-12">
                      <PlayCircle className="h-5 w-5 mr-2" />
                      {t('route.startVisit')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}