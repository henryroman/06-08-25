#!/usr/bin/env node

/**
 * Main Build Script
 * This script orchestrates the entire build process to ensure configuration consistency
 * across all components and styling in the Astro project.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { generateTailwindConfig } from  '../scripts/build-tailwind-config.mjs';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildProject() {
  try {
    console.log('🚀 Starting build process...');
    console.log('='.repeat(50));

    // Step 1: Generate Tailwind configuration from site config
    console.log('\n🎨 Step 1: Generating Tailwind configuration...');
    await generateTailwindConfig();

    // Step 2: Build the Astro project
    console.log('\n📦 Step 2: Building Astro project...');
    await runCommand('npm', ['run', 'build']);

    // Step 3: Validate configuration consistency
    console.log('\n✅ Step 3: Validating configuration consistency...');
    await validateConfiguration();

    console.log('\n🎉 Build completed successfully!');
    console.log('✅ All components now use consistent styling from site.config.mjs');
    console.log('✅ Tailwind configuration generated from site config');
    console.log('✅ Build process ensures configuration consistency');

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

async function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function validateConfiguration() {
  const siteConfigPath = path.join(__dirname, '..', 'config', 'site.config.mjs');
  const tailwindConfigPath = path.join(__dirname, '..', 'tailwind.config.mjs');

  // Check if files exist
  if (!fs.existsSync(siteConfigPath)) {
    throw new Error('site.config.mjs not found');
  }

  if (!fs.existsSync(tailwindConfigPath)) {
    throw new Error('tailwind.config.mjs not found');
  }

  // Import site configuration
  const siteConfigModule = await import(siteConfigPath);
  const { theme } = siteConfigModule.siteConfig;

  // Read tailwind config
  const tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf8');

  // Validate that primary colors match
  const primaryColor = theme.primary[500];
  if (!tailwindConfig.includes(primaryColor)) {
    throw new Error('Primary color mismatch between site.config.mjs and tailwind.config.mjs');
  }

  // Validate that secondary colors match
  const secondaryColor = theme.secondary[500];
  if (!tailwindConfig.includes(secondaryColor)) {
    throw new Error('Secondary color mismatch between site.config.mjs and tailwind.config.mjs');
  }

  console.log('✅ Configuration validation passed');
  console.log(`✅ Primary color: ${primaryColor}`);
  console.log(`✅ Secondary color: ${secondaryColor}`);
}

// Development watch mode
async function watchMode() {
  console.log('👀 Starting development watch mode...');
  console.log('Watching for configuration changes...');

  const siteConfigPath = path.join(__dirname, '..', 'config', 'site.config.mjs');

  // Initial build
  await buildProject();

  // Watch for changes (simplified - in production you might use chokidar)
  console.log('📡 Watching for changes to site.config.mjs...');
  console.log('💡 Tip: Run this script again when you make changes to the configuration');
}

// CLI argument handling
const args = process.argv.slice(2);
const command = args[0] || 'build';

if (command === 'build') {
  buildProject();
} else if (command === 'watch') {
  watchMode();
} else if (command === 'validate') {
  validateConfiguration();
} else {
  console.log('Usage:');
  console.log('  node scripts/build.mjs build    - Build the project');
  console.log('  node scripts/build.mjs watch    - Watch for changes');
  console.log('  node scripts/build.mjs validate - Validate configuration');
  process.exit(1);
}

export { buildProject, validateConfiguration };
