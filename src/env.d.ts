/// <reference path="../.astro/types.d.ts" />

// src/env.d.ts
declare module '*.json' {
  const value: any;
  export default value;
}
