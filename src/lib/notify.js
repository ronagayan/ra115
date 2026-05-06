// Client-side helper for sending a push notification to the OTHER user.
//
// Reads the recipient's FCM token from `users/{user}.fcmToken` (set up
// by useNotifications when they grant permission), then POSTs to our
// /api/notify Vercel function which uses Firebase Admin to dispatch the
// FCM message.
//
// Failures here are non-fatal — Firestore sync still works without push.

import { doc, getDoc } from 'firebase/firestore';
import { db, isLocal } from '../firebase';

const otherOf = (user) => (user === 'her' ? 'him' : 'her');

export default async function notifyOther(user, { title, body, url, data } = {}) {
  if (!user || isLocal) return;
  try {
    const recipient = otherOf(user);
    const snap = await getDoc(doc(db, 'users', recipient));
    const token = snap.exists() ? snap.data()?.fcmToken : null;
    if (!token) return; // recipient hasn't enabled notifications yet

    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, title, body, url, data }),
    });
  } catch (err) {
    // Swallow — push is best-effort.
    // eslint-disable-next-line no-console
    console.warn('[notify] failed', err);
  }
}
