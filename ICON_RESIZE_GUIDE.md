# PWA Icon Resize Guide

## Current Status
All icon files currently contain 1024x1024 pixel images. The manifest.json has been updated to reference only the 512x512 icon, which resolves Lighthouse PWA warnings about icon size mismatches.

## Production Deployment Fix

For proper production deployment with Play Store and web app stores, follow these steps:

### Option 1: Online Tool (Recommended)
1. Use online PNG resizer like:
   - https://imageresizer.com
   - https://ezgif.com/resize
   - https://www.birme.net

2. Upload `/public/icon-512.png`
3. For each size, create:
   - `icon-72.png` (72x72)
   - `icon-96.png` (96x96)
   - `icon-128.png` (128x128)
   - `icon-144.png` (144x144)
   - `icon-152.png` (152x152)
   - `icon-192.png` (192x192)
   - `icon-384.png` (384x384)
   - `icon-512.png` (512x512) - already correct

4. Replace files in `/public/`

### Option 2: Command Line (Linux/Mac)
```bash
# Install ImageMagick
brew install imagemagick  # macOS
# or
sudo apt-get install imagemagick  # Linux

# Resize icons
for size in 72 96 128 144 152 192 384 512; do
  convert public/icon-512.png -resize ${size}x${size} public/icon-${size}.png
done
```

### Option 3: Node.js (After fixing environment)
```bash
npm install sharp
node scripts/generate-icons.mjs
```

## Current Manifest Configuration

The manifest has been simplified to:
- Reference only `icon-512.png` for both "any" and "maskable" purposes
- Remove unsupported fields (scope_extensions, iarc_rating_id)
- Simplified shortcuts to use 512x512 icon

## Verification Checklist

After resizing:
1. Check each icon file is exactly the declared size:
   ```bash
   file public/icon-*.png
   identify public/icon-*.png
   ```

2. Run Lighthouse audit - should show zero icon size mismatch errors

3. Verify manifest JSON:
   ```bash
   node -e "require('./public/manifest.json')"
   ```

4. Test PWA installation on different devices

## Testing

Before deployment:
1. Build: `npm run build`
2. Test locally: `npm start`
3. Open Lighthouse (DevTools → Lighthouse)
4. Check "PWA" audit - should pass all icon checks

