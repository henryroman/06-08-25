export const siteConfig = {
  // Business Information
  business: {
    name: "Heavenly Nails & Beauty Salon",
    tagline: "Professional Beauty Services",
    description: "Transform your look with our expert nail and beauty treatments",
    phone: "+1 (555) 123-4567",
    email: "hello@heavenlynails.com",
    address: "123 Beauty Ave, Your City, State 12345",
    website: "https://heavenlynails.com"
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
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87'
    },
    neutral: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b'
    },

    fonts: {
      heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      '2xl': '1.5rem'
    },
    spacing: {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem',
      '2xl': '4rem',
      '3xl': '6rem'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
    },
    animations: {
      fadeIn: 'fadeIn 0.5s ease-in-out',
      slideUp: 'slideUp 0.6s ease-out',
      pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    }
  },

  // Layout & Design System
  layout: {
    container: {
      maxWidth: '1200px',
      padding: {
        mobile: '1rem',
        tablet: '2rem',
        desktop: '4rem'
      }
    },
    header: {
      height: '4rem',
      background: 'bg-white',
      shadow: 'shadow-md',
      sticky: true,
      mobile: {
        height: '3.5rem',
        padding: 'px-4'
      }
    },
    footer: {
      background: 'bg-gray-50',
      padding: 'py-12',
      borderTop: 'border-t border-gray-200',
      mobile: {
        padding: 'py-8'
      }
    },
    sections: {
      padding: 'py-16 lg:py-24',
      maxWidth: 'max-w-7xl mx-auto',
      mobile: {
        padding: 'py-12 lg:py-16'
      }
    }
  },

  // Component Styles
  components: {
    buttons: {
      primary: 'bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl',
      primaryMobile: 'bg-primary-600 hover:bg-primary-700 text-white font-medium py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl w-full',
      secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200',
      outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-medium py-3 px-6 rounded-lg transition-all duration-200',
      ghost: 'text-primary-600 hover:bg-primary-50 font-medium py-2 px-4 rounded-lg transition-all duration-200'
    },
    cards: {
      default: 'bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100',
      defaultMobile: 'bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 border border-gray-100',
      featured: 'bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 border border-primary-100',
      featuredMobile: 'bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border border-primary-100',
      minimal: 'bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-4',
      minimalMobile: 'bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-3'
    },
    inputs: {
      default: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200',
      defaultMobile: 'w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-lg',
      focused: 'w-full px-4 py-3 border-2 border-primary-500 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-500 transition-all duration-200'
    },
    modals: {
      overlay: 'bg-black bg-opacity-50 backdrop-blur-sm',
      content: 'bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden',
      contentMobile: 'bg-white rounded-2xl shadow-2xl w-full mx-2 max-h-[95vh] overflow-hidden',
      header: 'bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-6 sm:px-8 sm:py-8',
      headerMobile: 'bg-gradient-to-r from-primary-600 to-secondary-600 px-4 py-4',
      body: 'px-6 py-6 sm:px-8 sm:py-8 max-h-[calc(90vh-200px)] overflow-y-auto',
      bodyMobile: 'px-4 py-4 max-h-[calc(95vh-180px)] overflow-y-auto',
      footer: 'border-t border-gray-200 px-6 py-4 sm:px-8 sm:py-6 bg-gray-50',
      footerMobile: 'border-t border-gray-200 px-4 py-3 bg-gray-50'
    }
  },

  // Content Arrays (easily replaceable)
  content: {
    hero: {
      headline: "Beautiful Nails & Radiant Skin",
      subheadline: "Experience luxury beauty treatments in a relaxing atmosphere",
      cta: "Book Appointment",
      background: "bg-gradient-to-br from-primary-100 via-purple-50 to-secondary-100",
      textColor: "text-gray-900"
    },
    features: [
      {
        title: "Professional Nail Art",
        description: "Expert nail technicians creating stunning designs",
        icon: "🎨"
      },
      {
        title: "Luxury Spa Treatments",
        description: "Relaxing treatments for ultimate rejuvenation",
        icon: "💆‍♀️"
      },
      {
        title: "Expert Beauty Consultations",
        description: "Personalized beauty advice and recommendations",
        icon: "💡"
      },
      {
        title: "Premium Product Lines",
        description: "Only the finest products for your beauty needs",
        icon: "✨"
      }
    ],
    services: [
      { name: "Handjob", duration: 45, price: "$45", description: "Classic manicure with nail polish" },
      { name: "Pedicure", duration: 60, price: "$55", description: "Relaxing pedicure with foot massage" },
      { name: "Facial Treatment", duration: 90, price: "$85", description: "Deep cleansing facial treatment" },
      { name: "Gel Nails", duration: 75, price: "$65", description: "Long-lasting gel nail application" },
      { name: "Acrylic Nails", duration: 90, price: "$75", description: "Custom acrylic nail extensions" },
      { name: "Nail Art", duration: 60, price: "$40+", description: "Custom nail art and designs" }
    ],
    testimonials: [
      {
        name: "Sarah Johnson",
        text: "Amazing service! My nails have never looked better.",
        rating: 5,
        date: "2 weeks ago"
      },
      {
        name: "Emily Davis",
        text: "Professional staff and relaxing atmosphere. Highly recommend!",
        rating: 5,
        date: "1 month ago"
      },
      {
        name: "Jessica Brown",
        text: "Best nail salon in town! Always consistent quality.",
        rating: 5,
        date: "3 weeks ago"
      }
    ]
  },

  // Appointment System
  appointments: {
    types: [
      { name: "Manicure", duration: 45, price: "$45", notionField: "Manicure" },
      { name: "Pedicure", duration: 60, price: "$55", notionField: "Pedicure" },
      { name: "Facial Treatment", duration: 90, price: "$85", notionField: "Facial Treatment" },
      { name: "Gel Nails", duration: 75, price: "$65", notionField: "Gel Nails" },
      { name: "Acrylic Nails", duration: 90, price: "$75", notionField: "Acrylic Nails" },
      { name: "Nail Art", duration: 60, price: "$40+", notionField: "Nail Art" }
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
      "photos",
      "website",
      "reviews"
    ]
  },

  // SEO & Meta
  seo: {
    titleTemplate: "%s | %s",
    metaDescription: "Professional nail and beauty salon offering premium services in a relaxing atmosphere",
    keywords: ["nail salon", "beauty salon", "manicure", "pedicure", "facial", "nail art"],
    ogImage: "/og-image.jpg",
    twitterHandle: "@heavenlynails"
  },

  // Social Links
  social: [
    { name: "Facebook", url: "https://facebook.com/heavenlynails", icon: "fa-facebook", color: "text-blue-600" },
    { name: "Instagram", url: "https://instagram.com/heavenlynails", icon: "fa-instagram", color: "text-pink-600" },
    { name: "Twitter", url: "https://twitter.com/heavenlynails", icon: "fa-twitter", color: "text-blue-400" },
    { name: "TikTok", url: "https://tiktok.com/@heavenlynails", icon: "fa-tiktok", color: "text-black" }
  ]
};
