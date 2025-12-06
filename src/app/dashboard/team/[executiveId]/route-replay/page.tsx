
'use client';

import { useState, useEffect ,useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { ArrowLeft, CheckCircle, Clock, Play, Square, Pause, MapPin } from 'lucide-react';
import api from '@/services/api';
import { Label } from '@/components/ui/label';
import { SharedMapCanvas } from '@/components/maps/SharedMapCanvas';
import { useRouteAnimation } from '@/hooks/useRouteAnimation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

// --- Interfaces ---
interface LocationPoint { latitude: number; longitude: number;  timestamp: string; isPredicted?: boolean; }
interface PlannedVisit {
  locationId: number;
  locationName: string;
  latitude: number | null;
  longitude: number | null;

  status: number; // 0=Pending, 1=Approved, 3=Completed
}
interface Session {
  startTimeIST: string;
  endTimeIST: string | null;
}
interface StayPoint {
  latitude: number;
  longitude: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  address?: string;
}
interface RouteReplayData {
  totalDistanceKm: number;
  path: LocationPoint[];
  plannedVisits: PlannedVisit[];
  sessions: Session[];
  stayPoints: StayPoint[];
  startTime: string;
  endTime: string | null;
}

export default function RouteReplayPage() {
  const router = useRouter();
  const params = useParams();
  const executiveId = parseInt(params.executiveId as string);

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [replayData, setReplayData] = useState<RouteReplayData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [executiveName, setExecutiveName] = useState('');
  const [speed, setSpeed] = useState<number>(1);
  const [cameraFollow, setCameraFollow] = useState<boolean>(true);
useEffect(() => {
    const fetchExecutiveName = async () => {
      if (!executiveId) return;
      try {
        // Fetch user details by ID
        const response = await api.get(`/executives/${executiveId}`);
        // We check for fullName, name, or username depending on your API response
        setExecutiveName(response.data.fullName || response.data.name || response.data.username || `Executive #${executiveId}`);
      } catch (err) {
        console.error("Could not fetch executive name", err);
      }
    };
    fetchExecutiveName();
  }, [executiveId]);
  useEffect(() => {
    const fetchRouteHistory = async (selectedDate: Date) => {
      if (!executiveId) return;
      setIsLoading(true);
      setError('');
      setReplayData(null);

      try {
        // --- FIX #1: TIME ZONE BUG FIX ---
        // Adjust the date to noon in the local timezone before sending
        const adjustedDate = new Date(selectedDate);
        adjustedDate.setHours(12, 0, 0, 0);
        
       const response = await api.get('/tracking/history', {
  params: { 
    executiveId, 
    date: adjustedDate.toISOString()
  }
});

// Transform the response to handle C# Pascal Case -> JavaScript camelCase
const transformedData = {
  ...response.data,
  path: response.data.path?.map((point: any) => ({
    latitude: point.latitude ?? point.Latitude,
    longitude: point.longitude ?? point.Longitude,
    timestamp: point.timestamp ?? point.Timestamp,
    isPredicted: point.isPredicted ?? point.IsPredicted ?? false
  })) || [],
  stayPoints: response.data.stayPoints?.map((stay: any) => ({
    latitude: stay.latitude ?? stay.Latitude,
    longitude: stay.longitude ?? stay.Longitude,
    startTime: stay.startTime ?? stay.StartTime,
    endTime: stay.endTime ?? stay.EndTime,
    durationMinutes: stay.durationMinutes ?? stay.DurationMinutes,
    address: stay.address ?? stay.Address
  })) || []
};

setReplayData(transformedData);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch route history.");
      } finally {
        setIsLoading(false);
      }
    };
    if (date) {
      fetchRouteHistory(date);
    }
  }, [date, executiveId]);

  // Initialize animation hook
  const animation = useRouteAnimation({
    path: replayData?.path || [],
    speed: speed,
    onComplete: () => {
      console.log('Animation completed!');
    }
  });

  // Build full route segments (always computed)
  const fullRouteSegments = useMemo(() => {
    if (!replayData?.path || replayData.path.length === 0) {
      return [];
    }

    const segments: { path: { lat: number; lng: number }[]; isPredicted: boolean }[] = [];
    let currentSegment: { path: { lat: number; lng: number }[]; isPredicted: boolean } | null = null;

    for (const point of replayData.path) {
      const isPredicted = point.isPredicted || false;

      if (!currentSegment || currentSegment.isPredicted !== isPredicted) {
        if (currentSegment) {
          segments.push(currentSegment);
        }
        currentSegment = { path: [], isPredicted: isPredicted };

        if (segments.length > 0) {
          const lastSegment = segments[segments.length - 1];
          const lastPoint = lastSegment.path[lastSegment.path.length - 1];
          if (lastPoint) {
            currentSegment.path.push(lastPoint);
          }
        }
      }

      currentSegment.path.push({
        lat: point.latitude || (point as any).Latitude,
        lng: point.longitude || (point as any).Longitude
      });
    }

    if (currentSegment) {
      segments.push(currentSegment);
    }

    return segments;
  }, [replayData?.path]);

  // Use animated segments when animation is active, otherwise use full route
  const displaySegments = animation.isPlaying || animation.progress > 0
    ? animation.visibleSegments
    : fullRouteSegments;
  const visitMarkers = replayData?.plannedVisits
    ?.filter(v => v.latitude != null && v.longitude != null)
    .map(v => ({
      id: v.locationId,
      name: v.locationName,
      latitude: v.latitude!,
      longitude: v.longitude!,
      status: v.status
    })) || [];

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Team</Button>
      <h2 className="text-2xl font-bold">Route Replay
          {executiveName && (
    <span className="text-gray-500 font-normal text-lg">
      - {executiveName}
    </span>
  )}
      </h2>

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Date Picker and Distance */}
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label>Select Date to View</Label>
              <DatePicker date={date} onSelect={setDate} />
            </div>
            {replayData && (
              <div className="text-right">
                <p className="font-bold text-xl">{replayData.totalDistanceKm.toFixed(2)} km</p>
                <p className="text-sm text-gray-500">Total Distance Traveled</p>
              </div>
            )}
          </div>

          {/* Animation Controls */}
          {replayData && replayData.path && replayData.path.length > 1 && (
            <div className="space-y-3">
              {/* Control Buttons */}
              <div className="flex items-center gap-3">
                {!animation.isPlaying ? (
                  <Button
                    onClick={animation.play}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {animation.progress > 0 && animation.progress < 100 ? 'Resume' : 'Replay'}
                  </Button>
                ) : (
                  <Button
                    onClick={animation.pause}
                    variant="destructive"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}

                <Button
                  onClick={animation.reset}
                  variant="outline"
                >
                  Reset
                </Button>

                {/* Speed Selector */}
                <Select
                  value={speed.toString()}
                  onValueChange={(value) => setSpeed(parseFloat(value))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="1x" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="3">3x</SelectItem>
                  </SelectContent>
                </Select>

                {/* Camera Follow Toggle */}
                <Button
                  onClick={() => setCameraFollow(!cameraFollow)}
                  variant={cameraFollow ? "default" : "outline"}
                  size="sm"
                  className="ml-auto"
                >
                  {cameraFollow ? 'Following' : 'Overview'}
                </Button>
              </div>

              {/* Progress Slider */}
              <div className="space-y-1">
                <Slider
                  value={[animation.progress]}
                  onValueChange={(values: number[]) => animation.seekTo(values[0])}
                  max={100}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{Math.round(animation.progress)}% Complete</span>
                  {replayData.path.length > 0 && animation.currentIndex >= 0 && (
                    <span>
                      {new Date(replayData.path[animation.currentIndex]?.timestamp || replayData.path[0].timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map on the left */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-2 h-200 w-full">
              {isLoading ? <p className="text-center p-10">Loading route...</p> : error ? <p className="text-red-500 text-center p-10">{error}</p> : (
                displaySegments.length > 0 ? (
                  <SharedMapCanvas
                    segments={displaySegments}
                    markers={visitMarkers}
                    stayPoints={replayData?.stayPoints || []}
                    showLiveLocation={false}
                    endTime={replayData?.endTime}
                    animationMode={animation.isPlaying || animation.progress > 0}
                    animatedPosition={animation.currentPosition}
                    animatedBearing={animation.currentBearing}
                    isPredictedSegment={
                      replayData?.path[animation.currentIndex]?.isPredicted || false
                    }
                    cameraFollow={cameraFollow}
                  />
                ) : <p className="text-center p-10">No tracking data found for the selected date.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Itinerary and Sessions on the right */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle>Planned Itinerary</CardTitle></CardHeader>
            <CardContent className="p-4 max-h-64 overflow-y-auto">
              {isLoading ? <p>Loading...</p> : (
                <div className="space-y-4">
                  {visitMarkers.length > 0 ? visitMarkers.map((visit, index) => ( // Add 'index' here
  <div key={`${visit.id}-${index}`} className="flex items-start gap-3"> 
    {/* The key is now a combination of id and index, e.g., "123-0", "456-1", "123-2" */}
    <div className="shrink-0 mt-1">
      {visit.status === 3 ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <Clock className="h-5 w-5 text-gray-400" />
      )}
    </div>
    <div>
      <p className={`font-medium ${visit.status === 3 ? 'text-gray-500 line-through' : ''}`}>
        {visit.name}
      </p>
      <p className="text-xs text-gray-500">
        {visit.status === 3 ? 'Completed' : 'Pending'}
      </p>
    </div>
  </div>
)) : <p className="text-sm text-gray-500">No visits were completed on this day.</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* --- FEATURE #3: WORK SESSIONS CARD --- */}
          <Card>
            <CardHeader><CardTitle>Work Sessions</CardTitle></CardHeader>
            <CardContent className="p-4 max-h-48 overflow-y-auto">
              {isLoading ? <p>Loading...</p> : (
                <div className="space-y-3">
                  {replayData?.sessions && replayData.sessions.length > 0 ? replayData.sessions.map((session, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Play className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{new Date(session.startTimeIST).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-gray-400">-</span>
                      {session.endTimeIST ? (
                        <>
                          <Square className="h-4 w-4 text-red-500 shrink-0" />
                          <span>{new Date(session.endTimeIST).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                      ) : (
                        <span className="text-blue-500 font-semibold">Active</span>
                      )}
                    </div>
                  )) : <p className="text-sm text-gray-500">No work sessions recorded for this day.</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* --- NEW: STAY POINTS CARD --- */}
          <Card>
            <CardHeader><CardTitle>Stay Points</CardTitle></CardHeader>
            <CardContent className="p-4 max-h-64 overflow-y-auto">
              {isLoading ? <p>Loading...</p> : (
                <div className="space-y-3">
                  {replayData?.stayPoints && replayData.stayPoints.length > 0 ? replayData.stayPoints.map((stay, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 bg-orange-50 rounded-md border border-orange-200">
                      <MapPin className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          Stay #{index + 1}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(stay.startTime + 'Z').toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })} - {new Date(stay.endTime + 'Z').toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                        </p>
                        <p className="text-xs font-semibold text-orange-700 mt-1">
                          Duration: {stay.durationMinutes} min
                        </p>
                        {stay.address && (
                          <p className="text-xs text-gray-500 mt-1">
                            {stay.address}
                          </p>
                        )}
                      </div>
                    </div>
                  )) : <p className="text-sm text-gray-500">No stay points detected for this day.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}