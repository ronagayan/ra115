// Auto-loads any image dropped into src/assets/photos/.
// Just add 1.jpg, our-trip.jpg, whatever — it shows up.
//
// ⚠️  Do NOT use `#` or other URL-reserved chars (?, &, :, %) in filenames —
//     vite/rollup uses URLs internally and `#` is a fragment delimiter.
//     Spaces are OK. Stick to ASCII letters/digits/dashes/underscores.
//
// Optional captions: place a `captions.json` in the same folder
// keyed by filename (without extension):
//   { "1": "ביחד 💚", "our-trip": "טיול בצפון" }

// `query: '?url'` forces these to be loaded as asset URLs, which lets vite
// handle filenames with special chars (#, spaces, etc.) without trying to
// parse the JPG as JS.
const modules = import.meta.glob('../assets/photos/*.{png,jpg,jpeg,webp,avif,gif,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  query: '?url',
  import: 'default',
});

// Captions: optional. If src/assets/photos/captions.json exists, glob picks it up.
const captionModules = import.meta.glob('../assets/photos/captions.json', {
  eager: true,
  import: 'default',
});
const captions = Object.values(captionModules)[0] || {};

function nameOf(path) {
  return path.split('/').pop().replace(/\.[^.]+$/, '');
}

const loaded = Object.entries(modules)
  .map(([path, src]) => {
    const key = nameOf(path);
    return {
      id: key,
      src,
      caption: captions[key] || '',
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

// Fallback: a few labeled empty slots so the layout looks alive
// before any real photos are dropped in.
const PLACEHOLDERS = [
  { id: 'p1', src: null, caption: 'הראשון' },
  { id: 'p2', src: null, caption: 'יחד' },
  { id: 'p3', src: null, caption: '' },
  { id: 'p4', src: null, caption: 'בוקר' },
  { id: 'p5', src: null, caption: '' },
  { id: 'p6', src: null, caption: 'ים' },
  { id: 'p7', src: null, caption: '' },
  { id: 'p8', src: null, caption: 'לילה' },
  { id: 'p9', src: null, caption: '' },
];

export const PHOTOS = loaded.length > 0 ? loaded : PLACEHOLDERS;
export const HAS_REAL_PHOTOS = loaded.length > 0;

// Deterministic visual variation for polaroids.
const TILTS = [-5, 3, -2, 6, -7, 1, -4, 8, -3, 4, -6, 2];
const TAPES = ['#d8f3dc', '#f4d28a', '#e6d5a8', '#a3d9b1'];

export function decorate(p, i) {
  return {
    ...p,
    rot: TILTS[i % TILTS.length],
    tape: TAPES[i % TAPES.length],
  };
}
