// src/app/dashboard/direct-visit/page.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Check, Camera, Building2, Store, UserSquare, Currency } from 'lucide-react';
import api from '@/services/api';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from "@/hooks/use-toast";
import imageCompression from 'browser-image-compression'; // <-- YEH NAYA IMPORT HAI
import { FeedbackPopup } from '@/components/ui/FeedbackPopup'; // <-- YEH IMPORT KAREIN
import { getDistanceInKm } from '@/lib/geo'; // 1. IMPORT our new helper function
// --- ADD THIS INTERFACE ---
interface NearbyLocation {
  id: number;
  name: string;
  type: number;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}
export default function DirectVisitPage() {
  const { user } = useAuthContext();
  const router = useRouter();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<{ title: string; description: string; variant: 'success' | 'error' } | null>(null);
  const [locationName, setLocationName] = useState('');
  const [locationType, setLocationType] = useState('0'); // Default to School
  const [photo, setPhoto] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
    const [nearbySuggestions, setNearbySuggestions] = useState<NearbyLocation[]>([]);
  const [selectedExistingLocation, setSelectedExistingLocation] = useState<NearbyLocation | null>(null);
  // --- ADD THIS NEW STATE VARIABLE ---
  const [locationDetails, setLocationDetails] = useState<{
    lat: number;
    lng: number;
    address: string;
    city: string;
    district: string;
    pincode: string;
    
  } | null>(null);
  // --- END OF ADDITION ---
  
  
  // --- ADD THIS ENTIRE useEffect HOOK ---
  useEffect(() => {
    // Helper function to get address from coordinates
    const getAddressFromCoordinates = async (lat: number, lng: number) => {
      const geocoder = new window.google.maps.Geocoder();
      try {
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results[0]) {
          const result = response.results[0];
          const get = (type: string) => result.address_components?.find(c => c.types.includes(type))?.long_name || '';
          
          setLocationDetails({
            lat,
            lng,
            address: result.formatted_address || 'N/A',
            city: get('locality') || 'N/A',
            district: get('administrative_area_level_2') || 'N/A',
            pincode: get('postal_code') || 'N/A',
          });
        }
      } catch (error) {
        console.error("Reverse geocoding failed:", error);
        toast({ title: "Address Error", description: "Could not fetch address details for your location.", variant: "destructive" });
      }
    };
     // --- ADD THIS NEW HELPER FUNCTION ---
    const fetchNearbySuggestions = async (lat: number, lng: number) => {
      try {
        const response = await api.get(`/locations/nearby?lat=${lat}&lng=${lng}`);
        setNearbySuggestions(response.data);
      } catch (error) {
        console.error("Failed to fetch nearby suggestions:", error);
        // We don't show a toast here, as this is an optional enhancement
      }
    };
    // --- END OF ADDITION --
    // Main logic to get the user's current position
    // navigator.geolocation.getCurrentPosition(
    //   (position) => {
    //     getAddressFromCoordinates(position.coords.latitude, position.coords.longitude);
        
        
    //   },
     navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // --- ADD THIS NEW FUNCTION CALL ---
        // Now we call both functions
        getAddressFromCoordinates(lat, lng);
        fetchNearbySuggestions(lat, lng);
        // --- END OF ADDITION ---
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({ title: "Location Error", description: "Could not get your current location. Please enable location services.", variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [toast]); // Run this effect once when the component mounts
  // --- END OF ADDITION ---
  const handleSuggestionClick = (location: NearbyLocation) => {
    // When a suggestion is clicked, pre-fill the form AND store the selected location object
    setLocationName(location.name);
    setLocationType(location.type.toString());
    setSelectedExistingLocation(location);
  };
  const handleCompleteVisit = async () => {
    if (!user || !photo || !locationName ) {
            setFeedback({
        title: "Incomplete Form",
        description: "Please provide a name and a photo.",
        variant: "error",
      });
      return;
    }
      if (!locationDetails) {
      setFeedback({
        title: "Location Not Ready",
        description: "Location details are still being fetched. Please wait a moment and try again.",
        variant: "error",
      });
      return;
    }
    // --- GEOFENCING LOGIC ---
    if (selectedExistingLocation && selectedExistingLocation.latitude && selectedExistingLocation.longitude) {
      const distance = getDistanceInKm(
        locationDetails.lat,
        locationDetails.lng,
        selectedExistingLocation.latitude,
        selectedExistingLocation.longitude
      );
      const geofenceRadiusKm = 0.2; // 200 meters
      if (distance > geofenceRadiusKm) {
        toast({ title: "❌ Geofence Error", description: `You are ${Math.round(distance * 1000)}m away. Please move closer.`, variant: "destructive" });
        return;
      }
    }
    // --- END GEOFENCING ---
    setIsLoading(true);
     // --- YEH HAI ASLI FIX: PHOTO COMPRESSION ---
    console.log(`Original photo size: ${(photo.size / 1024 / 1024).toFixed(2)} MB`);

    const options = {
      maxSizeMB: 1,          // Max file size 1MB
      maxWidthOrHeight: 1920,  // Max width/height 1920px
      useWebWorker: true,      // Performance ke liye
    }
    let compressedFile;
    try {
      compressedFile = await imageCompression(photo, options);
      console.log(`Compressed photo size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
      console.error("Photo compression failed:", error);
      toast({ title: "Photo Error", description: "Could not process the photo. Please try another one.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    // --- END FIX ---

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const formData = new FormData();

      formData.append('SalesExecutiveId', user.id.toString());
      // NEW: If user selected an existing location, send its ID
      if (selectedExistingLocation) {
        formData.append('LocationId', selectedExistingLocation.id.toString());
      }
      formData.append('LocationName', locationName);
      formData.append('LocationType', locationType);
      formData.append('Latitude', latitude.toString());
      formData.append('Longitude', longitude.toString());
        formData.append('Address', locationDetails.address);
    formData.append('City', locationDetails.city);
    formData.append('District', locationDetails.district);
    formData.append('Pincode', locationDetails.pincode);
// 1. Original file ka extension nikalein (e.g., '.jpg', '.png')
const fileExtension = photo.name.split('.').pop();
// 2. Ek naya, unique file naam banayein jisme sahi extension ho
const newFileName = `compressed_${Date.now()}.${fileExtension || 'jpg'}`;
// 3. FormData me file ko naye naam ke saath append karein
formData.append('Photo', compressedFile, newFileName);
      try {
        const response = await api.post('/direct-visit', formData, { 
          headers: { 'Content-Type': 'multipart/form-data' } 
        });
        
        if (response.data.daTargetCompleted) {
        setFeedback({
            title: "🎉 Congratulations!",
            description: "You have completed your Daily Allowance target for today.",
               variant: "success",
          });
        } else {
          setFeedback({
            title: "✅ Success",
            description: "Direct Visit completed and saved!",
             variant: "success",
          });
        }
       setTimeout(() => {
            router.refresh();
            router.push('/dashboard');
        }, 1500);
          } catch (error) {
        setFeedback({
          title: "❌ Error",
          description: "Failed to save visit. Please try again.",
          variant: "error",
        });
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      setFeedback({
        title: "❌ Location Error",
        description: "Could not get your location. Please enable location services.",
        variant: "error",
      });
      setIsLoading(false);
    });
  };
  return (
    <>
    <div className="space-y-6 max-w-2xl mx-auto">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
      </Button>
      <h2 className="text-3xl font-bold">Direct Visit</h2>
       {/* --- 1. ADD THIS NEW SUGGESTIONS CARD --- */}
        {nearbySuggestions.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle>Nearby Location Suggestions</CardTitle>
              <p className="text-sm text-gray-600">Are you at one of these locations?</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {nearbySuggestions.map(loc => (
                <Button
                  key={loc.id}
                  variant="outline"
                  className="w-full h-auto justify-start text-left bg-white"
                  onClick={() => handleSuggestionClick(loc)}
                >
                  <div className="flex items-center">
                    {/* You can add icons here later if you want */}
                    <div className="flex-1">
                      <p className="font-semibold">{loc.name}</p>
                      <p className="text-xs text-gray-500">{loc.address}</p>
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        )}
        {/* --- END OF NEW CARD --- */}
      <Card>
        <CardHeader>
            <CardTitle>Or, Create a New Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="locationName" className="text-lg">Location Name *</Label>
            <Input
              id="locationName"
              value={locationName}
              onChange={(e) => {
                setLocationName(e.target.value);
                // If user manually types, clear the selected existing location
                setSelectedExistingLocation(null);
              }}
              className="h-12 text-lg"
              placeholder="e.g., Modern School, Sharma Kirana"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-lg">Location Type *</Label>
            <Select value={locationType} onValueChange={setLocationType}>
                <SelectTrigger className="h-12 text-lg">
                    <SelectValue placeholder="Select location type..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="0"><div className="flex items-center"><Building2 className="h-5 w-5 mr-2" /> School</div></SelectItem>
                    <SelectItem value="1"><div className="flex items-center"><UserSquare className="h-5 w-5 mr-2" /> Coaching</div></SelectItem>
                    <SelectItem value="2"><div className="flex items-center"><Store className="h-5 w-5 mr-2" /> Shopkeeper</div></SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-lg">Photo Proof *</Label>
            <Button 
              variant="outline" 
              className="w-full h-16 text-base" 
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-5 w-5 mr-2" />
              {photo ? `Selected: ${photo.name}` : 'Take / Select Photo'}
            </Button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              capture="environment" 
              onChange={(e) => setPhoto(e.target.files?.[0] || null)} 
              className="hidden" 
            />
          </div>
        </CardContent>
      </Card>
      <Button 
        onClick={handleCompleteVisit} 
        disabled={isLoading} 
        className="w-full text-xl py-8"
      >
        <Check className="h-6 w-6 mr-3" />
        {isLoading ? 'Saving...' : 'Complete Direct Visit'}
      </Button>
    </div>
    <FeedbackPopup
        isOpen={feedback !== null}
        onClose={() => setFeedback(null)}
        title={feedback?.title || ''}
        description={feedback?.description || ''}
        variant={feedback?.variant || 'success'}
      />
    </>
    
  );
}