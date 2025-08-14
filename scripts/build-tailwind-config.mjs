#!/usr/bin/env node

/**
 * Build Script: Generate Tailwind Configuration from Site Config
 * This script ensures consistent styling across all components by generating
 * the Tailwind configuration from the centralized site configuration.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import site configuration
const siteConfigPath = path.join(__dirname, '..', 'config', 'site.config.mjs');
const tailwindConfigPath = path.join(__dirname, '..', 'tailwind.config.mjs');

async function generateTailwindConfig() {
  try {
    console.log('🎨 Generating Tailwind configuration from site config...');

    // Read site configuration
    const siteConfigModule = await import(siteConfigPath);
    const { theme } = siteConfigModule.siteConfig;

    // Generate Tailwind theme configuration
    const tailwindTheme = {
      colors: {
        // Primary color palette from config
        primary: theme.primary,
        // Secondary color palette from config
        secondary: theme.secondary,
        // Neutral color palette from config
        neutral: theme.neutral,
        // Semantic color aliases
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16"
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03"
        },
        error: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a"
        }
      },
      fontFamily: {
        sans: [theme.fonts.body],
        serif: ["Georgia", "Cambria", "Times New Roman", "Times", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"]
      },
      borderRadius: theme.borderRadius,
      boxShadow: {
        ...theme.shadows,
        "glow": `0 0 20px ${theme.primary[500]}33`,
        "glow-lg": `0 0 40px ${theme.primary[500]}66`,
        "card": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "card-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "card-xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
      spacing: theme.spacing,
      animation: theme.animations,
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          },
        },
        slideDown: {
          "0%": {
            opacity: "0",
            transform: "translateY(-20px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          },
        },
        slideLeft: {
          "0%": {
            opacity: "0",
            transform: "translateX(20px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)"
          },
        },
        slideRight: {
          "0%": {
            opacity: "0",
            transform: "translateX(-20px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)"
          },
        },
        scaleIn: {
          "0%": {
            opacity: "0",
            transform: "scale(0.9)"
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)"
          },
        },
        bounceGentle: {
          "0%, 100%": {
            transform: "translateY(0)"
          },
          "50%": {
            transform: "translateY(-10px)"
          },
        },
        pulseGentle: {
          "0%, 100%": {
            opacity: "1"
          },
          "50%": {
            opacity: "0.7"
          },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionProperty: {
        "height": "height",
        "spacing": "margin, padding",
      },
    };

    // Generate the complete Tailwind configuration
    const tailwindConfig = `/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
  ],
  theme: {
    extend: ${JSON.stringify(tailwindTheme, null, 2)}
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        "heavenly": {
          "primary": "${theme.primary[500]}",
          "secondary": "${theme.secondary[500]}",
          "accent": "${theme.primary[400]}",
          "neutral": "${theme.neutral[800]}",
          "base-100": "#ffffff",
          "base-200": "${theme.neutral[100]}",
          "base-300": "${theme.neutral[200]}",
          "info": "#3b82f6",
          "success": "#22c55e",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
    ],
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
};`;

    // Write the generated configuration
    fs.writeFileSync(tailwindConfigPath, tailwindConfig);

    console.log('✅ Tailwind configuration generated successfully!');
    console.log('🎨 All styling is now driven by site.config.mjs');

  } catch (error) {
    console.error('❌ Error generating Tailwind configuration:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  generateTailwindConfig();
}

export { generateTailwindConfig };
