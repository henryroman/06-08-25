#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import prettier from 'prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const siteConfigPath = path.join(__dirname, '..', 'config', 'site.config.mjs');

export async function generateTailwindConfig() {
  try {
    console.log('🎨 Generating Tailwind configuration from site config...');

    const siteConfigModule = await import(pathToFileURL(siteConfigPath).href);
    const { theme } = siteConfigModule.siteConfig;

    const tailwindTheme = {
      colors: {
        primary: theme.primary,
        secondary: theme.secondary,
        neutral: theme.neutral
      },
      fontFamily: { sans: [theme.fonts.body] },
      borderRadius: theme.borderRadius
    };

    const tailwindConfig = `/** @type {import("tailwindcss").Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: { extend: ${JSON.stringify(tailwindTheme, null, 2)} },
  plugins: [require('daisyui')],
  daisyui: { themes: ["light"] }
};`;

    const tailwindConfigPath = path.join(__dirname, '..', 'tailwind.config.mjs');
    const formatted = await prettier.format(tailwindConfig, { parser: 'babel' });
    fs.writeFileSync(tailwindConfigPath, formatted, 'utf8');

    console.log('✅ Tailwind configuration generated successfully!');
  } catch (error) {
    console.error('❌ Error generating Tailwind configuration:', error);
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateTailwindConfig();
}
