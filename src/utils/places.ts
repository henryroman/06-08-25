export async function searchPlace(query: string, apiKey: string) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
  );
  return await response.json();
}

export async function getPlaceDetails(placeId: string, apiKey: string, fields: string[]) {
  const fieldsParam = fields.join(",");
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fieldsParam}&key=${apiKey}`
  );
  return await response.json();
}

export function formatBusinessData(placeDetails: any, apiKey: string) {
  return {
    name: placeDetails.name || "Business Name",
    address: placeDetails.formatted_address || "123 Main St, City, State 12345",
    phone: placeDetails.formatted_phone_number || "(555) 123-4567",
    website: placeDetails.website || "https://example.com",
    rating: placeDetails.rating || 4.5,
    openingHours: placeDetails.opening_hours?.weekday_text || [
      "Monday: 9:00 AM  6:00 PM",
      "Tuesday: 9:00 AM  6:00 PM", 
      "Wednesday: 9:00 AM  6:00 PM",
      "Thursday: 9:00 AM  6:00 PM",
      "Friday: 9:00 AM  6:00 PM",
      "Saturday: 10:00 AM – 4:00 PM",
      "Sunday: Closed"
    ],
    photos: placeDetails.photos?.slice(0, 5).map((photo: any) => 
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${apiKey}`
    ) || [],
    placeId: placeDetails.place_id || "default-place-id",
    lastUpdated: new Date().toISOString()
  };
}

export function getDefaultBusinessData() {
  return {
    name: "Heavenly Nails & Beauty Salon",
    address: "123 Beauty Lane, Spa City, SC 12345",
    phone: "(555) 123-NAILS",
    website: "https://heavenlynails.com",
    email: "info@heavenlynails.com",
    rating: 4.8,
    openingHours: [
      "Monday: 9:00 AM  7:00 PM",
      "Tuesday: 9:00 AM  7:00 PM", 
      "Wednesday: 9:00 AM  7:00 PM",
      "Thursday: 9:00 AM  7:00 PM",
      "Friday: 9:00 AM  7:00 PM",
      "Saturday: 9:00 AM  6:00 PM",
      "Sunday: 11:00 AM  5:00 PM"
    ],
    photos: [],
    placeId: "default-beauty-salon",
    lastUpdated: new Date().toISOString()
  };
}