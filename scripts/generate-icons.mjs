// Generates PWA icons from public/horse-pig.png:
//   - public/pwa-192.png        (Android home screen)
//   - public/pwa-512.png        (Android splash screen)
//   - public/apple-touch-icon.png (180x180, iOS Add to Home Screen)
//   - public/maskable-512.png   (Android adaptive icon — safe-zone padded)
//
// Each icon is the pig artwork centered on the brand dark-green
// background, with a small inset border for visual definition.

import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SRC  = resolve(ROOT, 'public/horse-pig.png');

const BG = { r: 13, g: 31, b: 22, alpha: 1 };           // --bg
const ACCENT = { r: 82, g: 183, b: 136, alpha: 1 };     // --highlight

async function makeIcon({ size, padding, file }) {
  const inner = size - padding * 2;
  const padded = await sharp(SRC)
    .resize(inner, inner, { fit: 'contain', background: BG })
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: padded, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(resolve(ROOT, 'public', file));

  console.log('✓', file, `(${size}×${size})`);
}

await makeIcon({ size: 192, padding: 16,  file: 'pwa-192.png' });
await makeIcon({ size: 512, padding: 40,  file: 'pwa-512.png' });
await makeIcon({ size: 180, padding: 10,  file: 'apple-touch-icon.png' });
// Maskable icons need extra safe-zone padding (Android crops to circle)
await makeIcon({ size: 512, padding: 90,  file: 'maskable-512.png' });

console.log('\nDone — drop new icons into public/.');
