export interface PlaceDetails {
  name?: string;
  address?: string;
  city?: string;
  district?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
}

export const getAddressFromCoordinates = async (lat: number, lng: number): Promise<Partial<PlaceDetails>> => {
  // Ensure the Google Maps script is loaded
  if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
    console.error("Google Maps Geocoder not available.");
    return {};
  }

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
        district: getAddressComponent('administrative_area_level_2'),
        pincode: getAddressComponent('postal_code'),
      };
    }
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
  }
  return {};
};