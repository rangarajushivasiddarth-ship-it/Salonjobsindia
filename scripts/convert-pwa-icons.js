#!/usr/bin/env node

/**
 * Convert and resize the Salon Jobs India logo to proper PWA icon sizes
 * Creates actual PNG files (not JPEG renamed as PNG)
 * Sizes: 72x72, 192x192, 512x512
 */

const fs = require('fs');
const path = require('path');

// Check if image conversion library is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('[v0] ERROR: sharp library not found');
  console.error('[v0] Install with: npm install --save-dev sharp');
  process.exit(1);
}

const SOURCE = path.join(__dirname, '../public/images/logo.png');
const OUTDIR = path.join(__dirname, '../public/salon-jobs-icons');
const SIZES = [72, 192, 512];

async function createIcons() {
  try {
    // Verify source file exists
    if (!fs.existsSync(SOURCE)) {
      throw new Error(`Source file not found: ${SOURCE}`);
    }

    // Verify source is a real PNG
    const sourceBuffer = fs.readFileSync(SOURCE);
    const metadata = await sharp(sourceBuffer).metadata();
    
    if (metadata.format !== 'png') {
      throw new Error(`Source file is not PNG format: ${metadata.format}`);
    }

    console.log(`[v0] Source logo: ${SOURCE}`);
    console.log(`[v0] Format: ${metadata.format}, Size: ${metadata.width}x${metadata.height}`);
    console.log(`[v0] Creating icons...`);

    // Ensure output directory exists
    if (!fs.existsSync(OUTDIR)) {
      fs.mkdirSync(OUTDIR, { recursive: true });
    }

    // Create each sized icon
    for (const size of SIZES) {
      const outputFile = path.join(OUTDIR, `${size}.png`);
      
      await sharp(sourceBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputFile);

      // Verify output
      const outputBuffer = fs.readFileSync(outputFile);
      const outputMetadata = await sharp(outputBuffer).metadata();
      
      console.log(`[v0] ✓ ${size}.png: ${outputMetadata.format} ${outputMetadata.width}x${outputMetadata.height}`);
    }

    console.log(`[v0] Done! All icons created as real PNG files.`);
    process.exit(0);
  } catch (error) {
    console.error(`[v0] ERROR: ${error.message}`);
    process.exit(1);
  }
}

createIcons();
