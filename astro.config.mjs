import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';
import 'dotenv/config';

/** @type {import('astro').AstroUserConfig} */
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [tailwind()],
  server: {
    port: 3000,
    host: true
  }
});
