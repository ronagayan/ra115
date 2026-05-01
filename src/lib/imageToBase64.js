// Read an image File, downscale + JPEG-compress in-browser via canvas, return
// a base64 data URL small enough to store inline in a Firestore doc
// (Firestore doc cap = 1 MiB; we target ~300 KiB).
//
// Why not Firebase Storage? Spark (free) plan no longer includes it by default
// — base64 inline avoids the dependency entirely.

const MAX_SIDE = 1280;
const QUALITY = 0.72;

export default function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('no file'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      try {
        // Always export as JPEG — much smaller than PNG for photos and
        // bypasses transparency edge cases.
        const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };
    img.src = url;
  });
}
