import { defineConfig } from 'vite';
import 'dotenv/config';

export default defineConfig({
  server: {
    port: 3000,
    host: true,
    allowedHosts: [
      'preview-chat-9e45e026-9c69-4227-8b05-1cb5fbc6c71d.space.z.ai',
      'localhost',
      '127.0.0.1'
    ]
  },
  preview: {
    port: 3000,
    host: true,
    allowedHosts: [
      'preview-chat-9e45e026-9c69-4227-8b05-1cb5fbc6c71d.space.z.ai',
      'localhost',
      '127.0.0.1'
    ]
  }
});