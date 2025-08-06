export const siteConfig = {
  // Business Information
  business: {
    name: "Heavenly Nails & Beauty Salon",
    tagline: "Professional Beauty Services",
    description: "Transform your look with our expert nail and beauty treatments",
    phone: "+1 (555) 123-4567",
    email: "hello@heavenlynails.com",
    address: "123 Beauty Ave, Your City, State 12345"
  },

  // Theme & Branding
  theme: {
    primary: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843'
    },

    fonts: {
      heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem'
    }
  },

  // Content Arrays (easily replaceable)
  content: {
    hero: {
      headline: "Beautiful Nails & Radiant Skin",
      subheadline: "Experience luxury beauty treatments in a relaxing atmosphere",
      cta: "Book Appointment"
    },
    features: [
      "Professional Nail Art",
      "Luxury Spa Treatments",
      "Expert Beauty Consultations",
      "Premium Product Lines"
    ],
    services: [
      { name: "Manicure", duration: 45, price: "" },
      { name: "Pedicure", duration: 60, price: "" },
      { name: "Facial Treatment", duration: 90, price: "" }
    ]
  },

  // Appointment System
  appointments: {
    types: [
      { name: "Manicure", duration: 45, price: "", notionField: "Manicure" },
      { name: "Pedicure", duration: 60, price: "", notionField: "Pedicure" },
      { name: "Facial", duration: 90, price: "", notionField: "Facial Treatment" }
    ],
    businessHours: {
      monday: { open: "09:00", close: "19:00" },
      tuesday: { open: "09:00", close: "19:00" },
      wednesday: { open: "09:00", close: "19:00" },
      thursday: { open: "09:00", close: "19:00" },
      friday: { open: "09:00", close: "20:00" },
      saturday: { open: "08:00", close: "18:00" },
      sunday: { closed: true }
    },
    timezone: "America/New_York",
    bufferTime: 30 // 30-minute gaps
  },

  // Google Places Integration
  googlePlaces: {
    enabled: true,
    placeId: "ChIJExample123", // Set during build
    fields: [
      "name",
      "formatted_address",
      "formatted_phone_number",
      "opening_hours",
      "rating",
      "photos"
    ]
  },

  // Social Links
  social: [
    { name: "Facebook", url: "https://facebook.com/yourbiz", icon: "fa-facebook" },
    { name: "Instagram", url: "https://instagram.com/yourbiz", icon: "fa-instagram" },
    { name: "Twitter", url: "https://twitter.com/yourbiz", icon: "fa-twitter" }
  ]
};
