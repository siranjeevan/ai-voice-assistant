#!/usr/bin/env node

/**
 * Configuration Checker for AI Voice Assistant
 * Validates environment variables and configuration
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔧 Checking AI Voice Assistant Configuration...\n');

// Check if .env file exists
const envPath = join(rootDir, '.env');
if (!existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('📝 Please copy .env.example to .env and configure it:');
  console.log('   cp .env.example .env\n');
  process.exit(1);
}

// Read and parse .env file
const envContent = readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

let hasErrors = false;

// Check required variables
const required = ['VITE_API_KEYS_ENDPOINT'];
required.forEach(key => {
  if (!envVars[key]) {
    console.error(`❌ Missing required variable: ${key}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${key}: configured`);
  }
});

// Validate API endpoint URL
if (envVars.VITE_API_KEYS_ENDPOINT) {
  try {
    const url = new URL(envVars.VITE_API_KEYS_ENDPOINT);
    if (url.protocol !== 'https:') {
      console.warn('⚠️  API endpoint should use HTTPS for security');
    }
    if (!url.hostname.includes('script.google.com')) {
      console.warn('⚠️  API endpoint should be a Google Apps Script URL');
    }
    console.log(`✅ API endpoint URL format: valid`);
  } catch (error) {
    console.error(`❌ Invalid API endpoint URL: ${error.message}`);
    hasErrors = true;
  }
}

// Check optional variables
const optional = [
  'VITE_CACHE_DURATION',
  'VITE_MAX_RETRIES', 
  'VITE_REQUEST_TIMEOUT',
  'VITE_MIN_REQUEST_INTERVAL'
];

console.log('\n📋 Optional Configuration:');
optional.forEach(key => {
  if (envVars[key]) {
    const value = parseInt(envVars[key]);
    if (isNaN(value)) {
      console.warn(`⚠️  ${key}: should be a number (got: ${envVars[key]})`);
    } else {
      console.log(`✅ ${key}: ${value}`);
    }
  } else {
    console.log(`➖ ${key}: using default`);
  }
});

// Final result
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('❌ Configuration has errors! Please fix them before running the app.');
  process.exit(1);
} else {
  console.log('✅ Configuration is valid! Ready to run the app.');
  console.log('\n🚀 Start the app with: npm run dev');
}