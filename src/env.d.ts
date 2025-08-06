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
