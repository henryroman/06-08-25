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
    host: true,
    allowedHosts: [
      'preview-chat-9e45e026-9c69-4227-8b05-1cb5fbc6c71d.space.z.ai',
      'localhost',
      '127.0.0.1'
    ]
  },
  compilerOptions: {
    allowSyntheticDefaultImports: true,
  },
});
