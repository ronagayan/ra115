// Vercel serverless function — sends an FCM push to a single device token.
//
// Setup:
//   1. Firebase Console → Project Settings → Service Accounts → Generate
//      new private key. Download the JSON.
//   2. Vercel Dashboard → Project Settings → Environment Variables.
//      Add `FIREBASE_SERVICE_ACCOUNT` with the *entire JSON string*
//      (escaped) from step 1. Apply to Production + Preview + Development.
//   3. Redeploy.
//
// Without the env var the endpoint returns 503 and the client silently
// falls back to no-push behavior — Firestore sync still works.

import admin from 'firebase-admin';

let initialized = false;
function init() {
  if (initialized) return;
  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set');
    const sa = JSON.parse(raw);
    admin.initializeApp({ credential: admin.credential.cert(sa) });
  }
  initialized = true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    init();
  } catch (err) {
    return res.status(503).json({
      error: 'Push notifications not configured',
      detail: err.message,
    });
  }

  const { token, title, body, url, data } = req.body || {};
  if (!token) return res.status(400).json({ error: 'token required' });

  try {
    const message = {
      token,
      notification: {
        title: title || '💚',
        body: body || '',
      },
      webpush: {
        headers: { Urgency: 'high' },
        notification: {
          icon: '/pwa-192.png',
          badge: '/pwa-192.png',
          vibrate: [200, 100, 200],
        },
        fcmOptions: url ? { link: url } : undefined,
      },
      data: data || {},
    };
    const id = await admin.messaging().send(message);
    return res.status(200).json({ ok: true, id });
  } catch (err) {
    // Stale tokens (UNREGISTERED) are normal — just report and move on.
    return res.status(500).json({ error: err.message, code: err.code });
  }
}
