#!/usr/bin/env node

/**
 * Main Build Script
 */
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import { spawn } from 'child_process';
import { generateTailwindConfig } from './build-tailwind-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildProject() {
  try {
    console.log('🚀 Starting build process...');
    console.log('='.repeat(50));

    // Step 1: Tailwind config
    console.log('\n🎨 Step 1: Generating Tailwind configuration...');
    await generateTailwindConfig();

    // Step 2: Astro build (no more `build:no-places`)
    console.log('\n📦 Step 2: Building Astro project...');
    await runCommand('astro', ['build']);

    // Step 3: Validate
    console.log('\n✅ Step 3: Validating configuration consistency...');
    await validateConfiguration();

    console.log('\n🎉 Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

async function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with exit code ${code}`));
    });

    child.on('error', reject);
  });
}

async function validateConfiguration() {
  const siteConfigPath = path.join(__dirname, '..', 'config', 'site.config.mjs');
  const tailwindConfigPath = path.join(__dirname, '..', 'tailwind.config.mjs');

  if (!fs.existsSync(siteConfigPath)) throw new Error('site.config.mjs not found');
  if (!fs.existsSync(tailwindConfigPath)) throw new Error('tailwind.config.mjs not found');

  const siteConfigModule = await import(pathToFileURL(siteConfigPath).href);
  const { theme } = siteConfigModule.siteConfig;

  const tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf8');
  if (!tailwindConfig.includes(theme.primary[500])) throw new Error('Primary color mismatch');
  if (!tailwindConfig.includes(theme.secondary[500])) throw new Error('Secondary color mismatch');

  console.log('✅ Configuration validation passed');
}

const args = process.argv.slice(2);
const command = args[0] || 'build';

if (command === 'build') {
  buildProject();
} else if (command === 'validate') {
  validateConfiguration();
} else {
  console.log('Usage: node scripts/build.mjs build|validate');
  process.exit(1);
}

export { buildProject, validateConfiguration };
