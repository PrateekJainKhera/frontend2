// Updated QuickVisitPage - Replace the entire component
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Check, Camera, Loader2, MapPin } from 'lucide-react';
import api from '@/services/api';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { getAddressFromCoordinates, PlaceDetails } from '@/lib/maps-helper'; // <-- REPLACE the placeholder function with this import
import { MapSearch } from '../plan/map/MapSearch';
import { FeedbackPopup } from '@/components/ui/FeedbackPopup';
import { PlaceOrderModal, type OrderItem } from '@/app/dashboard/visit/[visitId]/PlaceOrderModal';
import { Book } from '@/types';
// import { type Book } from '@/types'; // <-- ADD THIS LINE

export default function QuickVisitPage() {
  const { user } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const visitType = searchParams.get('type');
  const planId = searchParams.get('planId'); // ✅ GET THE BEAT PLAN ID
  const { toast } = useToast();
 // --- ADD THESE NEW STATE VARIABLES ---
  const [step, setStep] = useState<'select' | 'capture'>('select');
const [locationDetails, setLocationDetails] = useState<(PlaceDetails & { lat: number, lng: number }) | null>(null);
  const [nearbySuggestions, setNearbySuggestions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
id: number | null;
    name: string;
    type: number;
    address?: string;
    city?: string;
    district?: string;
    pincode?: string;
  } | null>(null);
  // --- END OF ADDITION ---
const [feedback, setFeedback] = useState<{ title: string; description: string; variant: 'success' | 'error' } | null>(null);
  const [locationName, setLocationName] = useState('');

  const [photo, setPhoto] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states for different visit types
  const [shopkeeperName, setShopkeeperName] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [salesFeedback, setSalesFeedback] = useState('');
  const [shopkeeperWhatsApp, setShopkeeperWhatsApp] = useState('');
  const [isRecommending, setIsRecommending] = useState(false);
 // 2. ADD NEW STATE FOR THE ORDER
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const [teacherName, setTeacherName] = useState('');
  const [coachingSubjects, setCoachingSubjects] = useState('');
  const [coachingClasses, setCoachingClasses] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolSubjects, setSchoolSubjects] = useState('');
  const [schoolClasses, setSchoolClasses] = useState('');
  const [coachingStrength, setCoachingStrength] = useState('');
  const [coachingTeacherMobile, setCoachingTeacherMobile] = useState('');
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  // Type for available books (for order modal)



useEffect(() => {
    setIsLoading(true);

    const fetchInitialData = async (lat: number, lng: number) => {
      try {
        // Use Promise.all to run all three network requests in parallel.
        // This is the most efficient way to load the data.
        await Promise.all([
          // Task 1: Get the address and update state
          getAddressFromCoordinates(lat, lng).then(details => {
            setLocationDetails({ lat, lng, ...details });
          }),
          
          // Task 2: Get nearby suggestions and update state
          api.get(`/locations/nearby?lat=${lat}&lng=${lng}`).then(response => {
            const desiredType = visitType === 'shopkeeper' ? 2 : 1;
            const filteredSuggestions = response.data.filter((loc: any) => loc.type === desiredType);
            setNearbySuggestions(filteredSuggestions);
          }),

          // Task 3: Get the list of all books and update state
          api.get('/books').then(response => {
            setAllBooks(response.data);
          })
        ]);
      } catch (error) {
        console.error("Failed during initial data fetch:", error);
        toast({ title: "Error", description: "Could not load all necessary data.", variant: "destructive" });
      } finally {
        // This runs after all promises are settled (either success or failure)
        setIsLoading(false);
      }
    };

    // Get the user's current location.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Once we have the location, trigger the data fetching process.
        fetchInitialData(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({ title: "Location Error", description: "Could not get your location. Please enable location services.", variant: "destructive" });
        setIsLoading(false); // Also stop loading on error
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [toast, visitType]); // Dependencies are correct

const handleConfirmOrder = (items: OrderItem[]) => {
    setOrderItems(items);
    // We don't need to close the modal here, the modal does it itself.
  };
 // --- 2. CORRECTED: The final, robust handleSaveAndComplete function ---
  const handleSaveAndComplete = async () => {

    const finalLocationName = selectedLocation?.id !== null ? selectedLocation?.name : locationName;

    if (!user || !photo || !finalLocationName) {
      toast({ title: "Incomplete Form", description: "Please provide a location name and a photo.", variant: "destructive" });
      return;
    }
        if (!locationDetails) {
        toast({ title: "Location Error", description: "Could not get your current location. Please wait a moment and try again.", variant: "destructive" });
        return;
    }
      if (!selectedLocation) {
      toast({ title: "Logic Error", description: "No location has been selected.", variant: "destructive" });
      return;
    }


    setIsLoading(true);
    
   try {
      // --- STEP 1: SAVE THE VISIT ---
      const formData = new FormData();
      formData.append('SalesExecutiveId', user.id.toString());
      formData.append('CheckInPhoto', photo);
      formData.append('Latitude', locationDetails.lat.toString());
      formData.append('Longitude', locationDetails.lng.toString());

      // This logic correctly handles sending either an existing ID or new location details
      if (selectedLocation.id !== null) {
        formData.append('LocationId', selectedLocation.id.toString());
        formData.append('LocationType', selectedLocation.type.toString());
      } else {
        formData.append('NewLocationName', finalLocationName);
        formData.append('LocationType', selectedLocation.type.toString());
        formData.append('Address', selectedLocation.address || locationDetails.address || '');
        formData.append('City', selectedLocation.city || locationDetails.city || '');
        formData.append('District', selectedLocation.district || locationDetails.district || '');
        formData.append('Pincode', selectedLocation.pincode || locationDetails.pincode || '');
      }

      if (planId) {
        formData.append('BeatPlanId', planId);
      }

      if (visitType === 'shopkeeper') {
        formData.append('Details[ShopkeeperName]', shopkeeperName);
        formData.append('Details[StockStatus]', stockStatus);
        formData.append('Details[SalesFeedback]', salesFeedback);
        formData.append('Details[WhatsAppNumber]', shopkeeperWhatsApp);
        formData.append('Details[IsRecommending]', isRecommending.toString());
      } else if (visitType === 'tuition') {
        formData.append('Details[TeacherName]', teacherName);
        formData.append('Details[CoachingSubjects]', coachingSubjects);
        formData.append('Details[CoachingClasses]', coachingClasses);
        formData.append('Details[SchoolName]', schoolName);
        formData.append('Details[SchoolSubjects]', schoolSubjects);
        formData.append('Details[SchoolClasses]', schoolClasses);
        formData.append('Details[CoachingStrength]', coachingStrength);
        formData.append('Details[IsRecommending]', isRecommending.toString());
      }
      if (orderItems.length > 0) {
  const sanitizedOrderItems = orderItems.map(item => ({ 
    bookId: item.bookId, 
    quantity: item.quantity 
  }));
  formData.append('OrderItemsJson', JSON.stringify(sanitizedOrderItems));
}


      const visitResponse = await api.post('/quick-visit', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });

     

      if (visitResponse.data.daTargetCompleted) {
        toast({ title: "🎉 Congratulations!", description: "Visit and Order saved! You've also completed your DA target.", className: "bg-green-100 border-green-400" });
      } else {
        toast({ title: "✅ Success", description: "Visit and Order have been saved successfully!" });
      }

      router.push('/dashboard');

    } catch (error) {
      console.error('Save error:', error);
      toast({ title: "❌ Error", description: "Failed to save visit or order. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && step === 'select') {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="mt-4 text-gray-600">Getting your location and nearby places...</p>
      </div>
    );
  }



  return (
    <>
      <div className="space-y-6 max-w-2xl mx-auto">
        <Button variant="outline" onClick={() => step === 'capture' ? setStep('select') : router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h2 className="text-3xl font-bold capitalize">New {visitType} Visit</h2>

        {/* --- STEP 1: SELECT LOCATION UI --- */}
        {step === 'select' && (
          <div className="space-y-6">
            {/* Suggestions Card */}
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
                      onClick={() => {
                        setSelectedLocation({
                          id: loc.id,
                          name: loc.name,
                          type: loc.type,
                          address: loc.address,
                          city: loc.city,
                          district: loc.district,
                          pincode: loc.pincode
                        });
                        setStep('capture');
                      }}
                    >
                      <div className="flex items-center">
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

            {/* Search and Create New Card */}
            <Card>
              <CardHeader>
                <CardTitle>Or, Find / Create a Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <MapSearch

                  onGphLocationSelect={(loc) => {
                    setSelectedLocation({
                      id: loc.id,
                      name: loc.name,
                      type: loc.type,
                      address: loc.address,
                      city: loc.city,
                      district: loc.district,
                      pincode: loc.pincode
                    });
                    setStep('capture');
                  }}
                  onGooglePlaceSelect={(details) => {
                    setSelectedLocation({
                      id: null,
                      name: details.name,
                      type: visitType === 'shopkeeper' ? 2 : 1,
                      address: details.address,
                      city: details.city,
                      district: details.district,
                      pincode: details.pincode,
                    });
                    setStep('capture');
                  }}
                />
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    if (!locationDetails) {
                      toast({ title: "Location not ready", description: "Please wait a moment for your location to be found.", variant: "destructive" });
                      return;
                    }
                    setSelectedLocation({
                      id: null,
                      name: '', // User will type this in the next step
                      type: visitType === 'shopkeeper' ? 2 : 1,
                      address: locationDetails.address,
                      city: locationDetails.city,
                      district: locationDetails.district,
                      pincode: locationDetails.pincode,
                    });
                    setStep('capture');
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Mark My Current Location as New
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* --- STEP 2: CAPTURE DETAILS UI --- */}
        {step === 'capture' && selectedLocation && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Visit Details & Proof</CardTitle>
                <p className="text-sm text-gray-500">You are checking in at: <span className="font-bold">{selectedLocation.name || 'New Location'}</span></p>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedLocation.id === null && !selectedLocation.name && (
                  <div className="space-y-2">
                    <Label htmlFor="locationName">Location Name *</Label>
                    <Input 
                      id="locationName" 
                      value={locationName} 
                      onChange={(e) => setLocationName(e.target.value)} 
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Photo Proof *</Label>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
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

            {visitType === 'shopkeeper' && (
              <Card>
                <CardHeader><CardTitle>Shopkeeper Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Shopkeeper Name</Label>
                    <Input value={shopkeeperName} onChange={(e) => setShopkeeperName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp Number</Label>
                    <Input value={shopkeeperWhatsApp} onChange={(e) => setShopkeeperWhatsApp(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock Status</Label>
                    <Select value={stockStatus} onValueChange={setStockStatus}>
                      <SelectTrigger><SelectValue placeholder="Select stock status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="OutOfStock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>How was the sale of our products?</Label>
                    <Textarea value={salesFeedback} onChange={(e) => setSalesFeedback(e.target.value)} />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label>Are you recommending our brand?</Label>
                    <Switch checked={isRecommending} onCheckedChange={setIsRecommending} />
                  </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
   <Label>Want to place an order?</Label>
  <Switch 
    checked={orderItems.length > 0} // Check if items are in the order
    onCheckedChange={(checked) => {
      if (checked) {
        setIsOrderModalOpen(true); // If toggled on, open the modal
      } else {
        setOrderItems([]); // If toggled off, clear the order
      }
    }} 
  />
</div>
                </CardContent>
              </Card>
            )}
            
            {visitType === 'tuition' && (
              <Card>
                <CardHeader><CardTitle>Coaching Teacher Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Teacher Name</Label>
                    <Input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                      <Label>Teacher's Mobile Number</Label>
                      <Input 
                        type="tel" 
                        maxLength={10}
                        value={coachingTeacherMobile} 
                        onChange={(e) => setCoachingTeacherMobile(e.target.value.replace(/[^0-9]/g, ''))} 
                        placeholder="Enter 10-digit number"
                      />
                    </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Subjects Taught (Coaching)</Label>
                      <Input value={coachingSubjects} onChange={(e) => setCoachingSubjects(e.target.value)} placeholder="e.g., Maths, Science" />
                    </div>
                    <div className="space-y-2">
                      <Label>Classes Taught (Coaching)</Label>
                      <Input value={coachingClasses} onChange={(e) => setCoachingClasses(e.target.value)} placeholder="e.g., 9th, 10th" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Student Strength (Coaching)</Label>
                    <Input type="number" value={coachingStrength} onChange={(e) => setCoachingStrength(e.target.value)} />
                  </div>
                  <div className="p-4 border rounded-lg space-y-4">
                    <h4 className="font-semibold">School Teaching Details (if any)</h4>
                    <div className="space-y-2">
                      <Label>School Name</Label>
                      <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="Enter school name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Subjects Taught (School)</Label>
                        <Input value={schoolSubjects} onChange={(e) => setSchoolSubjects(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Classes Taught (School)</Label>
                        <Input value={schoolClasses} onChange={(e) => setSchoolClasses(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label>Are you recommending our books?</Label>
                    <Switch checked={isRecommending} onCheckedChange={setIsRecommending} />
                  </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label>Want to place an order?</Label>
                    <Switch 
                      checked={orderItems.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setIsOrderModalOpen(true);
                        } else {
                          setOrderItems([]);
                        }
                      }} 
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              onClick={handleSaveAndComplete} 
  disabled={isLoading || !photo || !(selectedLocation?.id !== null ? selectedLocation.name : locationName)}
              className="w-full text-lg py-6"
            >
              <Check className="h-5 w-5 mr-2" />
              {isLoading ? 'Saving...' : 'Save & Complete Visit'}
            </Button>
          </div>
        )}
      </div>
      <PlaceOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        books={allBooks} // Assuming you have 'allBooks' state from the Teacher Interaction page
        onConfirmOrder={handleConfirmOrder}
      />
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