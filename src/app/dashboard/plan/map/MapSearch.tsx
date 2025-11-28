// src/app/dashboard/plan/map/MapSearch.tsx
'use client';

import { useState, useEffect } from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { Search, Building, MapPin, Mic, MicOff } from 'lucide-react';
import api from '@/services/api';
import { useLanguage } from '@/context/LanguageContext'; // ADD THIS

export interface GphLocation {
  id: number;
  name: string;
  type: number;
  latitude: number;
  longitude: number;
}
interface GooglePlaceSuggestion {
  place_id: string;
  description: string;
}
export interface PlaceDetails {
  name: string;
  address: string;
  city: string;
    district: string; // <-- ADD THIS LINE

  pincode: string;
  lat: number;
  lng: number;
}

interface MapSearchProps {
  onGphLocationSelect: (location: GphLocation) => void;
  onGooglePlaceSelect: (details: PlaceDetails) => void;
}

export function MapSearch({ onGphLocationSelect, onGooglePlaceSelect }: MapSearchProps) {
  const { t } = useLanguage(); // ADD THIS
  const [gphResults, setGphResults] = useState<GphLocation[]>([]);
    const [isListening, setIsListening] = useState(false);

  const {
    ready,
    value,
    suggestions: { status, data: googleResults },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { componentRestrictions: { country: 'in' } },
    debounce: 300,
  });

  useEffect(() => {
    const fetchGphResults = async () => {
      if (value.length > 2) {
        try {
          const response = await api.get(`/locations/search?term=${value}`);
          setGphResults(response.data);
        } catch (error) {
          console.error("Failed to search GPH locations", error);
        }
      } else {
        setGphResults([]);
      }
    };
    fetchGphResults();
  }, [value]);
    useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setValue(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };

    if (isListening) {
      recognition.start();
    }

    return () => {
      recognition.stop();
    };
  }, [isListening, setValue]);

  const handleGoogleSelect = async (place: GooglePlaceSuggestion) => {
    setValue(place.description, false);
    clearSuggestions();
    setGphResults([]);
    
    const getPlaceDetails = (placeId: string): Promise<PlaceDetails> => {
      return new Promise((resolve, reject) => {
        if (!window.google?.maps?.places) {
          return reject("Google Places Service not available.");
        }
        const service = new window.google.maps.places.PlacesService(document.createElement('div'));
        service.getDetails({
          placeId: placeId,
          fields: ['name', 'formatted_address', 'address_components', 'geometry']
        }, (result, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && result) {
            const getAddressComponent = (type: string) => 
              result.address_components?.find(c => c.types.includes(type))?.long_name || '';

            const details: PlaceDetails = {
              name: result.name || 'Unknown Name',
              address: result.formatted_address || '',
              city: getAddressComponent('locality'),
                            district: getAddressComponent('administrative_area_level_2'), // Extract the district

              pincode: getAddressComponent('postal_code'),
              lat: result.geometry?.location?.lat() || 0,
              lng: result.geometry?.location?.lng() || 0,
            };
            resolve(details);
          } else {
            reject(status);
          }
        });
      });
    };

    try {
      const placeDetails = await getPlaceDetails(place.place_id);
      onGooglePlaceSelect(placeDetails);
    } catch (error) {
      console.error("Error fetching place details:", error);
    }
  };

  const handleGphSelect = (location: GphLocation) => {
    setValue(location.name, false);
    clearSuggestions();
    setGphResults([]);
    onGphLocationSelect(location);
  };

  return (
    <div className="relative w-full z-10">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        placeholder={t('planMap.searchPlaceholder')}
  className="w-full pl-10 pr-12 py-3 border rounded-lg shadow-md text-base" // <-- Change pr-4 to pr-12
      />
       {/* --- ADD THIS BUTTON --- */}
      <button 
        type="button"
        onClick={() => setIsListening(prev => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-blue-600"
        disabled={!ready}
        aria-label="Start voice search"
      >
        {isListening ? <MicOff className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
      </button>
      {/* --- END BUTTON --- */}
      
      {(gphResults.length > 0 || googleResults.length > 0) && (
        <ul className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-lg overflow-hidden z-20">
          {gphResults.length > 0 && (
            <>
              <li className="p-2 bg-gray-100 text-sm font-bold text-gray-500">{t('planMap.ourDatabase')}</li>
              {gphResults.map((loc) => (
                <li key={`gph-${loc.id}`} onClick={() => handleGphSelect(loc)} className="p-3 hover:bg-gray-100 cursor-pointer flex items-center text-base">
                  <Building className="h-5 w-5 mr-2 text-blue-500" />
                  {loc.name}
                </li>
              ))}
            </>
          )}
          {status === 'OK' && (
            <>
              <li className="p-2 bg-gray-100 text-sm font-bold text-gray-500">{t('planMap.googleSuggestions')}</li>
              {googleResults.map((place) => (
                <li key={place.place_id} onClick={() => handleGoogleSelect(place)} className="p-3 hover:bg-gray-100 cursor-pointer flex items-center text-base">
                  <MapPin className="h-5 w-5 mr-2 text-red-500" />
                  {place.description}
                </li>
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
}