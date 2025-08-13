/// <reference path="../.astro/types.d.ts" />
/// <reference path="./types/business.d.ts" />

// src/env.d.ts
declare module '*.json' {
  const value: any;
  export default value;
}

declare module '../../data/business.json' {
  const value: Business;
  export default value;
}


// src/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: 'development' | 'production';
    NOTION_TOKEN?: string;
    NOTION_CUSTOMERS_DB_ID?: string;
    NOTION_APPOINTMENTS_DB_ID?: string;
    GOOGLE_PLACES_API_KEY?: string;
    // other env vars...
  }
}
