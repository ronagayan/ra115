import { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db, isLocal } from '../firebase';
import { VAPID_KEY } from '../config';

// Initializes web push for the current user:
//   1. requests Notification permission (only on user gesture; we expose
//      a `request` callback for that)
//   2. obtains an FCM device token
//   3. writes it to `users/{user}.fcmToken` so the other side can target
//      it via /api/notify when sending a note or making a move
//
// Foreground messages also get displayed via the Notification API since
// FCM doesn't auto-show them when the page is visible.

export default function useNotifications(user) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [token, setToken] = useState(null);

  // Foreground handler — show the notification ourselves
  useEffect(() => {
    if (!messaging) return;
    const unsub = onMessage(messaging, (payload) => {
      const title = payload?.notification?.title || payload?.data?.title || '💚';
      const body = payload?.notification?.body || payload?.data?.body || '';
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(title, { body, icon: '/pwa-192.png' });
        } catch {
          /* some browsers throw on direct construction in non-secure contexts */
        }
      }
    });
    return unsub;
  }, []);

  // If we already had permission from a previous visit, refresh the token
  // (it can rotate) and re-register it.
  useEffect(() => {
    if (!user || isLocal || !messaging) return;
    if (permission !== 'granted') return;
    refreshToken().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, permission]);

  async function refreshToken() {
    if (!messaging || !user) return null;
    if (!VAPID_KEY || VAPID_KEY.startsWith('REPLACE_WITH')) return null;
    try {
      const reg = await navigator.serviceWorker.ready;
      const t = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: reg,
      });
      if (t) {
        setToken(t);
        await setDoc(
          doc(db, 'users', user),
          { fcmToken: t, updatedAt: Date.now() },
          { merge: true }
        );
      }
      return t;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[useNotifications] getToken failed', err);
      return null;
    }
  }

  // Call this from a user gesture (button click) to request permission.
  async function request() {
    if (typeof Notification === 'undefined') return 'unsupported';
    let p = Notification.permission;
    if (p === 'default') {
      p = await Notification.requestPermission();
    }
    setPermission(p);
    if (p === 'granted') await refreshToken();
    return p;
  }

  return { permission, token, request };
}
