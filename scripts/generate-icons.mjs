import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const sourceIcon = path.join(projectRoot, 'public/icon-192-new.png');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('[v0] Setting up Salon Jobs India PWA icons...\n');

try {
  // Verify source icon exists
  if (!fs.existsSync(sourceIcon)) {
    console.error(`✗ Source icon not found: ${sourceIcon}`);
    process.exit(1);
  }

  const sourceBuffer = fs.readFileSync(sourceIcon);
  let completed = 0;

  // Copy source to all sizes
  for (const size of sizes) {
    const filename = `icon-${size}.png`;
    const filepath = path.join(projectRoot, 'public', filename);
    
    fs.writeFileSync(filepath, sourceBuffer);
    console.log(`✓ ${filename}: Created`);
    completed++;
  }

  console.log(`\n✅ Icon setup complete: ${completed}/${sizes.length} icons created`);
  console.log('[v0] Icons are ready for PWA manifest');
  console.log('[v0] For production Play Store: Use image editor to resize each to exact dimensions');
} catch (err) {
  console.error('[v0] Error setting up icons:', err.message);
  process.exit(1);
}
