'use client';
import { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap , useApiIsLoaded} from '@vis.gl/react-google-maps';
import api from '@/services/api';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import { SelectionSheet, SelectedLocationForSheet } from './SelectionSheet';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MapSearch, PlaceDetails, GphLocation } from './MapSearch';
import { DatePicker } from '@/components/ui/date-picker';
// import { toast } from '@/hooks/use-toast';
import { FeedbackPopup } from '@/components/ui/FeedbackPopup';
import { PinpointControl } from './PinpointControl'; // 1. Import the new component
import { CreateLocationModal } from './CreateLocationModal'; // 1. Import
interface MapMarker {
  id: number;
  name: string;
  type: number;
  latitude: number;
  longitude: number;
   status: number;
}
interface SelectedLocation {
  uniqueKey: string;
  locationId?: number;
  locationType: number;
  newLocationName?: string;
  latitude?: number;
  longitude?: number;
  displayName: string;
  address?: string;
  city?: string;
    district?: string; // Add district

  pincode?: string;
}
const getAddressFromCoordinates = async (lat: number, lng: number): Promise<Partial<PlaceDetails>> => {
  const geocoder = new window.google.maps.Geocoder();
  const latlng = { lat, lng };
  
  try {
    const response = await geocoder.geocode({ location: latlng });
    if (response.results[0]) {
      const result = response.results[0];
      const getAddressComponent = (type: string) => 
        result.address_components?.find(c => c.types.includes(type))?.long_name || '';

      return {
        address: result.formatted_address,
        city: getAddressComponent('locality'),
        district: getAddressComponent('administrative_area_level_2'), // District for India
        pincode: getAddressComponent('postal_code'),
      };
    }
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
  }
  return {}; // Return empty object on failure
};

function MapController({ onMapLoad }: { onMapLoad: (map: google.maps.Map) => void }) {
  const map = useMap();
  useEffect(() => { if (map) { onMapLoad(map); } }, [map, onMapLoad]);
  return null;
  
}
export default function PlanOnMapPage() {
  const { user } = useAuthContext();
  const { t } = useLanguage();
  const router = useRouter();
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<SelectedLocation[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [planDate, setPlanDate] = useState<Date | undefined>(new Date());
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pinpointCoords, setPinpointCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [feedback, setFeedback] = useState<{ title: string; description: string; variant: 'success' | 'error' } | null>(null);
    const [newLocationDetails, setNewLocationDetails] = useState<Partial<PlaceDetails>>({});

  // --- 2. ADD THE NEW HANDLER FUNCTION ---
  const handlePinpoint = async () => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const newPos = { lat: latitude, lng: longitude };
      
      map?.panTo(newPos);
      map?.setZoom(18);
      
      // Call our new helper function to get the address
      const addressDetails = await getAddressFromCoordinates(latitude, longitude);
      setNewLocationDetails(addressDetails); // Save the fetched address details
      
      setPinpointCoords(newPos);
      setIsCreateModalOpen(true);
    }, (error) => {
      alert("Could not get your location. Please enable location services.");
    });
  };
    const handleCreateNewLocation = (name: string, type: number) => {
    if (!pinpointCoords) return;

    const newLocation: SelectedLocation = {
      uniqueKey: `new-${name}-${Date.now()}`,
      locationType: type,
      newLocationName: name,
      latitude: pinpointCoords.lat,
      longitude: pinpointCoords.lng,
      displayName: name,
      // Populate with the details we fetched in handlePinpoint
      address: newLocationDetails.address,
      city: newLocationDetails.city,
      district: newLocationDetails.district,
      pincode: newLocationDetails.pincode,
    };
    
    setSelectedLocations(prev => [...prev, newLocation]);
    setIsCreateModalOpen(false);
    setPinpointCoords(null);
    setNewLocationDetails({}); // Clear details for the next use
  };
  useEffect(() => {
    const fetchMarkers = async () => {
      if (!user) return;
      try {
        const response = await api.get('/locations/my-assigned-markers');
        setMarkers(response.data);
      } catch (err) {
        console.error("Failed to fetch markers:", err);
      }
    };
    fetchMarkers();
  }, [user]);
  const handleAddLocationToPlan = (location: SelectedLocation) => {
    if (!selectedLocations.some(loc => loc.uniqueKey === location.uniqueKey)) {
      setSelectedLocations(prev => [...prev, location]);
    }
  };
  const handleGooglePlaceSelect = useCallback((details: PlaceDetails) => {
    map?.panTo({ lat: details.lat, lng: details.lng });
    map?.setZoom(15);
    const newLocation: SelectedLocation = {
      uniqueKey: `new-${details.address}`,
      locationType: 0,
      newLocationName: details.name,
      latitude: details.lat,
      longitude: details.lng,
      displayName: details.name,
      address: details.address,
      city: details.city,
      pincode: details.pincode
    };
    handleAddLocationToPlan(newLocation);
  }, [map, selectedLocations]);
  const handleGphLocationSelect = useCallback((gphLocation: GphLocation) => {
    map?.panTo({ lat: gphLocation.latitude, lng: gphLocation.longitude });
    map?.setZoom(15);
    const newLocation: SelectedLocation = {
      uniqueKey: `existing-${gphLocation.type}-${gphLocation.id}`,
      locationId: gphLocation.id,
      locationType: gphLocation.type,
      displayName: gphLocation.name
    };
    handleAddLocationToPlan(newLocation);
  }, [map, selectedLocations]);
  const handleMarkerClick = (marker: MapMarker) => {
    const uniqueKey = `existing-${marker.type}-${marker.id}`;
    const isSelected = selectedLocations.some(loc => loc.uniqueKey === uniqueKey);
    if (isSelected) {
      setSelectedLocations(prev => prev.filter(loc => loc.uniqueKey !== uniqueKey));
    } else {
      handleAddLocationToPlan({ uniqueKey, locationId: marker.id, locationType: marker.type, displayName: marker.name });
    }
  };
  const handleConfirmPlan = async () => {
    if (!user || selectedLocations.length === 0 || !planDate) {
      setFeedback({
        title: t('planMap.error'),
        description: t('planMap.selectDateAndLocation'),
        variant: "error",
      });
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        salesExecutiveId: user.id,
        planDate: planDate.toISOString(),
        locations: selectedLocations.map(loc => ({
          locationId: loc.locationId,
          locationType: loc.locationType,
          newLocationName: loc.newLocationName,
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address,
          city: loc.city,
          pincode: loc.pincode
        })),
      };
      await api.post('/beatplans', payload);
      setFeedback({
        title: t('planMap.success'),
        description: t('planMap.planCreated'),
        variant:"success",
        // className: "bg-green-100 border-green-400",
      });
       setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      console.error("Failed to create plan:", err);
      setFeedback({
        title: t('planMap.error'),
        description: t('planMap.planError'),
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const getPinColor = (type: number) => {
    if (type === 1) return { background: '#8b5cf6', borderColor: '#c4b5fd' };
    if (type === 2) return { background: '#10b981', borderColor: '#6ee7b7' };
    return { background: '#3b82f6', borderColor: '#93c5fd' };
  };
   return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} libraries={['places']}>
      <div className="relative w-full h-screen lg:h-[calc(100vh-4rem)]">
        <Map
          defaultCenter={{ lat: 22.7196, lng: 75.8577 }}
          defaultZoom={12}
          mapId="gph-planning-map"
          gestureHandling="greedy"
          disableDefaultUI={true}
          className="w-full h-full"
        >
          <MapController onMapLoad={setMap} />
          {markers.map(marker => {
            const uniqueKey = `existing-${marker.type}-${marker.id}`;
            const isSelected = selectedLocations.some(l => l.uniqueKey === uniqueKey);
            return (
              <AdvancedMarker key={uniqueKey} position={{ lat: marker.latitude, lng: marker.longitude }} onClick={() => handleMarkerClick(marker)}>
                <Pin {...getPinColor(marker.type)} borderColor={isSelected ? 'black' : getPinColor(marker.type).borderColor} />
              </AdvancedMarker>
            );
          })}
          {/* --- YEH HAI CHANGE: Yahan se PinpointControl ko hata diya gaya hai --- */}
        </Map>
        
        {/* --- YEH HAI CHANGE: Upar ke saare controls ab is ek container ke andar hain --- */}
        <div className="absolute top-0 left-0 right-0 p-4 flex flex-col gap-3 z-10 pointer-events-none">
          {/* Top Row: Back Button and Search Bar */}
          <div className="flex items-center gap-2 w-full pointer-events-auto">
              <Button variant="secondary" size="icon" onClick={() => router.back()} className="shadow-lg rounded-full">
                  <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                  <div className="bg-white rounded-full shadow-lg">
                      <MapSearch
                          key={user?.id}
                          onGphLocationSelect={handleGphLocationSelect}
                          onGooglePlaceSelect={handleGooglePlaceSelect}
                      />
                  </div>
              </div>
          </div>
          {/* Bottom Row: Date Picker and Pinpoint Button */}
          <div className="flex justify-end items-center gap-2 w-full pointer-events-auto">
              <div className="bg-white rounded-lg shadow-lg">
                  <DatePicker date={planDate} onSelect={setPlanDate} />
              </div>
              <PinpointControl onClick={handlePinpoint} />
          </div>
        </div>
        <SelectionSheet
          selectedLocations={selectedLocations.map(l => ({ uniqueKey: l.uniqueKey, displayName: l.displayName, locationType: l.locationType }))}
          onRemove={(locToRemove) => setSelectedLocations(prev => prev.filter(l => l.uniqueKey !== locToRemove.uniqueKey))}
          onConfirm={handleConfirmPlan}
          isLoading={isLoading}
        />
      </div>
       <CreateLocationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onConfirm={handleCreateNewLocation}
          coordinates={pinpointCoords}
        />
          <FeedbackPopup
        isOpen={feedback !== null}
        onClose={() => setFeedback(null)}
        title={feedback?.title || ''}
        description={feedback?.description || ''}
        variant={feedback?.variant || 'success'}
      />
    </APIProvider>
  );
}