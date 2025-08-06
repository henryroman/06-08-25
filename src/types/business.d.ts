export interface Business {
  name: string;
  tagline?: string;
  description?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  rating: number;
  openingHours: string[];
  photos: string[];
  reviews: Review[];
  placeId: string;
  lastUpdated: string;
}

export interface Review {
  author: string;
  rating: number;
  text: string;
  relativeTime?: string;
  date?: string;
}