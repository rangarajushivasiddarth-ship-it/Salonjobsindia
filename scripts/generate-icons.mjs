import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const logoPath = path.join(projectRoot, 'public/images/logo.png');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('Generating Salon Jobs India icons...\n');

let completed = 0;
let errors = 0;

const generateIcon = async (size) => {
  const filename = `icon-${size}.png`;
  const filepath = path.join(projectRoot, 'public', filename);
  
  try {
    await sharp(logoPath)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png()
      .toFile(filepath);
    
    console.log(`✓ ${filename}: ${size}x${size}`);
    completed++;
  } catch (err) {
    console.error(`✗ ${filename}: ${err.message}`);
    errors++;
  }
};

// Generate all sizes in parallel
await Promise.all(sizes.map(generateIcon));

console.log(`\n✅ Icon generation complete: ${completed}/${sizes.length} succeeded`);
if (errors > 0) {
  console.log(`⚠️  ${errors} errors`);
}
