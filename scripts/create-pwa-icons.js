#!/usr/bin/env node

/**
 * Create PWA icons from the original Salon Jobs India logo
 * Uses the salon-jobs-india-logo.png as the source
 */

const fs = require('fs');
const path = require('path');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SOURCE_LOGO = path.join(__dirname, '../public/images/salon-jobs-india-logo.png');
const OUTPUT_DIR = path.join(__dirname, '../public/salon-jobs-icons');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('[v0] PWA Icon Generator');
console.log('[v0] Source logo:', SOURCE_LOGO);
console.log('[v0] Output directory:', OUTPUT_DIR);

// Since we don't have a proper image processing library available in the sandboxed environment,
// we'll copy the source logo with a note about proper resizing

// Read the original logo
if (!fs.existsSync(SOURCE_LOGO)) {
  console.error('[v0] ERROR: Source logo not found at', SOURCE_LOGO);
  process.exit(1);
}

const logoBuffer = fs.readFileSync(SOURCE_LOGO);
console.log(`[v0] Source logo size: ${(logoBuffer.length / 1024).toFixed(2)} KB`);

// For now, copy the logo to all sizes as a fallback
// In production, use ImageMagick or ffmpeg: convert logo.png -resize 72x72 72.png
SIZES.forEach(size => {
  const outputFile = path.join(OUTPUT_DIR, `${size}.png`);
  fs.writeFileSync(outputFile, logoBuffer);
  console.log(`[v0] Created: ${outputFile} (same as source - manual resizing recommended)`);
});

console.log('[v0]');
console.log('[v0] ⚠️  IMPORTANT: For proper PWA icons, resize these files to actual dimensions:');
SIZES.forEach(size => {
  console.log(`[v0]   convert ../images/salon-jobs-india-logo.png -resize ${size}x${size} ${size}.png`);
});
console.log('[v0]');
console.log('[v0] Or use: ffmpeg -i ../images/salon-jobs-india-logo.png -vf scale=${size}:${size} ${size}.png');
console.log('[v0]');
console.log('[v0] Current setup uses source logo for all sizes (fallback)');
console.log('[v0] Install ImageMagick or ffmpeg for proper resizing');
