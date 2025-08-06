import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

console.log('🔍 Loading env from:', envPath);
const raw = fs.readFileSync(envPath, 'utf-8');
console.log('📄 .env contents:\n' + raw);
loadEnv({ path: envPath, override: true });

// Explicitly load the .env file sitting next to package.json
console.log('🔍 Loading env from:', envPath);
loadEnv({ path: envPath, override: true });

async function fetchPlacesData() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACES_ID;

  console.log('🔑 Loaded GOOGLE_PLACES_API_KEY:', apiKey ? '[REDACTED]' : '‹missing›');
  console.log('📌 Loaded GOOGLE_PLACES_ID:', placeId || '‹missing›');

  if (!apiKey || !placeId) {
    console.log('❌ Missing key or place ID – creating default data');
    return createDefaultBusinessData();
  }

  try {
    console.log(`📍 Fetching Google Place details for ID: ${placeId}`);
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${placeId}` +
      `&fields=name,formatted_address,formatted_phone_number,international_phone_number,opening_hours,rating,photos,website,reviews` +
      `&key=${apiKey}`
    );
    const data = await res.json();

    if (!data.result) {
      console.warn('⚠️ No result from Google, falling back to defaults');
      return createDefaultBusinessData();
    }

    const businessData = {
      name: data.result.name,
      address: data.result.formatted_address,
      phone: data.result.formatted_phone_number,
      email: data.result.international_phone_number || '',
      website: data.result.website,
      rating: data.result.rating,
      openingHours: data.result.opening_hours?.weekday_text || [],
      photos: (data.result.photos || []).slice(0, 5).map(p =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photo_reference}&key=${apiKey}`
      ),
      reviews: (data.result.reviews || []).slice(0, 5).map(r => ({
        author: r.author_name,
        rating: r.rating,
        text: r.text,
        relativeTime: r.relative_time_description
      })),
      placeId,
      lastUpdated: new Date().toISOString()
    };

    save(businessData);
    console.log('✅ Google Places data saved to src/data/business.json');
    return businessData;

  } catch (e) {
    console.error('❌ Error fetching Google Places:', e.message);
    return createDefaultBusinessData();
  }
}

function save(obj) {
  const outPath = path.join(__dirname, '../src/data/business.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(obj, null, 2));
}

function createDefaultBusinessData() {
  const def = {
    name: "Heavenly Nails & Beauty Salon",
    address: "123 Beauty Ave, Your City, State 12345",
    phone: "+1 (555) 123-4567",
    email: "hello@heavenlynails.com",
    website: "https://heavenlynails.com",
    rating: 4.8,
    openingHours: [
      "Monday: 9:00 AM – 7:00 PM",
      "Tuesday: 9:00 AM – 7:00 PM",
      "Wednesday: 9:00 AM – 7:00 PM",
      "Thursday: 9:00 AM – 7:00 PM",
      "Friday: 9:00 AM – 8:00 PM",
      "Saturday: 8:00 AM – 6:00 PM",
      "Sunday: Closed"
    ],
    photos: [],
    reviews: [],
    placeId: "default",
    lastUpdated: new Date().toISOString()
  };
  save(def);
  console.log('✅ Default business data created');
  return def;
}

// Always run when invoked
fetchPlacesData();
