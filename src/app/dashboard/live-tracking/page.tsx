'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow,useMap } from '@vis.gl/react-google-maps';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Clock, AlertTriangle, RefreshCw, MapPin, Search, MapIcon, List } from 'lucide-react'; // Import MapPin
import { TimeAgo } from '@/components/TimeAgo';
import { useAuthContext } from '@/context/AuthContext';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // 1. Import the Input component

// 1. UPDATE: The interface now expects an 'address' string
interface LiveLocation {
  salesExecutiveId: number;
  executiveName: string;
  asmName: string;
  latitude: number;
  longitude: number;
  lastUpdated: string;
  address: string; // This is the new, pre-fetched address from the backend
}
// --- Helper Component to handle Camera Movement ---
// This fixes the zoom issue by separating manual zoom from programmatic zoom
function MapUpdater({ center, zoom }: { center: { lat: number; lng: number }, zoom: number }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.moveCamera({
      center: center,
      zoom: zoom
    });
  }, [map, center, zoom]);

  return null;
}

export default function LiveTrackingPage() {
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 22.7196, lng: 75.8577 });
  const [zoomLevel, setZoomLevel] = useState(12);
  const [openInfoWindowId, setOpenInfoWindowId] = useState<number | null>(null);
  const [allLiveLocations, setAllLiveLocations] = useState<LiveLocation[]>([]);
  //const [selectedTeam, setSelectedTeam] = useState('all');
  
  // --- 2. ADD NEW STATE FOR SEARCH ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
    const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  const fetchLiveLocations = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await api.get('/tracking/live');
      setAllLiveLocations(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch live locations:", error);
      setError("Could not refresh live data. Please check your connection.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveLocations();
  }, [fetchLiveLocations]);

  // const filteredLocations = useMemo(() => {
  //   if (selectedTeam === 'all') {
  //     return allLiveLocations;
  //   }
  //   return allLiveLocations.filter(exec => exec.asmName === selectedTeam);
  // }, [selectedTeam, allLiveLocations]);
const filteredLocations = useMemo(() => {
    return allLiveLocations
      .filter(exec => {
        // Team Filter
        const teamMatch = selectedTeam === 'all' || exec.asmName === selectedTeam;
        if (!teamMatch) return false;
        
        // Search Filter
        const searchMatch = searchTerm.trim() === '' || 
                            exec.executiveName.toLowerCase().includes(searchTerm.toLowerCase());
        return searchMatch;
      });
  }, [selectedTeam, allLiveLocations, searchTerm]); // Add searchTerm to dependencies
  const handleExecutiveSelect = (executive: LiveLocation) => {
    setMapCenter({ lat: executive.latitude, lng: executive.longitude });
    setZoomLevel(15);
    setOpenInfoWindowId(executive.salesExecutiveId);
        setMobileView('map');

  };

  const asmTeams = useMemo(() =>
    [...new Set(allLiveLocations.map(loc => loc.asmName).filter(name => name !== 'N/A'))],
    [allLiveLocations]
  );

  if (isLoading) {
    return <div>Loading live tracking data...</div>;
  }
return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      {/* Main container: flex-col on mobile, flex-row on large screens */}
      <div className="flex flex-col h-[calc(100vh-4rem)] lg:flex-row lg:gap-6">
        
        {/* List Card: Visible on mobile if mobileView is 'list', always visible on desktop */}
        <Card className={`w-full lg:w-1/3 lg:max-w-sm flex flex-col ${mobileView === 'list' ? 'flex' : 'hidden'} lg:flex`}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Active Executives ({filteredLocations.length})</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => fetchLiveLocations()} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {lastUpdated && (
              <p className="text-xs text-gray-500 pt-1">
                Last updated: <TimeAgo timestamp={lastUpdated.toISOString()} />
              </p>
            )}
            
            <div className="pt-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              {user?.roleName === 'Admin' && (
                <div className="space-y-2">
                  <Label>Filter by Team</Label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {asmTeams.map(asm => <SelectItem key={asm} value={asm}>{asm}'s Team</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto">
            {error && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg flex items-start">
                <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2">
              {filteredLocations.length === 0 && !error ? (
                <div className="text-center py-12 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-2" />
                  <p>{searchTerm || selectedTeam !== 'all' ? 'No executives match your filters.' : 'No executives are currently active.'}</p>
                </div>
              ) : (
                filteredLocations.map((exec, index) => (
                  <div
                    key={`${exec.salesExecutiveId}-${index}`}
                    className={`p-3 rounded-lg cursor-pointer border ${
                      openInfoWindowId === exec.salesExecutiveId ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleExecutiveSelect(exec)}
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">{exec.executiveName}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        <TimeAgo timestamp={exec.lastUpdated} />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 flex items-start">
                      <MapPin className="h-4 w-4 mr-2 shrink-0 mt-0.5" />
                      <span>{exec.address}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Map Container: Visible on mobile if mobileView is 'map', always visible on desktop */}
 <div className={`flex-1 h-full w-full ${mobileView === 'map' ? 'block' : 'hidden'} lg:block`}>
          <Map
            defaultCenter={{ lat: 22.7196, lng: 75.8577 }} // Changed to defaultCenter
            defaultZoom={12}                               // Changed to defaultZoom
            mapId="gph-live-map"
            className="w-full h-full rounded-lg shadow-md"
            gestureHandling={'greedy'} // Allows one-finger zoom/pan on mobile
            disableDefaultUI={false}
          >
            {/* Add the Helper Component here */}
            <MapUpdater center={mapCenter} zoom={zoomLevel} />

            {filteredLocations.map(exec => (
              <AdvancedMarker
                key={exec.salesExecutiveId}
                position={{ lat: exec.latitude, lng: exec.longitude }}
                title={exec.executiveName}
                onClick={() => setOpenInfoWindowId(exec.salesExecutiveId)}
              >
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg">
                  <User className="h-4 w-4" />
                </div>
              </AdvancedMarker>
            ))}
            
            {openInfoWindowId !== null && (() => {
              const executive = filteredLocations.find(e => e.salesExecutiveId === openInfoWindowId);
              if (!executive) return null;
              return (
                <InfoWindow
                  position={{ lat: executive.latitude, lng: executive.longitude }}
                  onCloseClick={() => setOpenInfoWindowId(null)}
                >
                  <div className="p-2">
                    <h3 className="font-bold text-gray-900">{executive.executiveName}</h3>
                    <p className="text-sm text-gray-600">Last Update: <TimeAgo timestamp={executive.lastUpdated} /></p>
                    <p className="text-sm text-gray-600 mt-1 flex items-start">
                      <MapPin className="h-4 w-4 mr-2 shrink-0 mt-0.5" />
                      <span>{executive.address}</span>
                    </p>
                  </div>
                </InfoWindow>
              );
            })()}
          </Map>
        </div>

        {/* Mobile View Toggle Buttons: Only visible on small screens */}
        <div className="lg:hidden fixed bottom-4 right-4 z-20 flex flex-col gap-2">
          <Button 
            size="icon" 
            className={`h-14 w-14 rounded-full shadow-lg transition-colors ${mobileView === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'}`}
            onClick={() => setMobileView('list')}
          >
            <List className="h-6 w-6" />
          </Button>
          <Button 
            size="icon" 
            className={`h-14 w-14 rounded-full shadow-lg transition-colors ${mobileView === 'map' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'}`}
            onClick={() => setMobileView('map')}
          >
            <MapIcon className="h-6 w-6" />
          </Button>
        </div>

      </div>
    </APIProvider>
  );
}