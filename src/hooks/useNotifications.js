import { useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db } from '../firebase';
import { VAPID_KEY } from '../config';

export default function useNotifications(user) {
  useEffect(() => {
    if (!user || !messaging) return;

    async function init() {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token) {
          await setDoc(doc(db, 'users', user), { fcmToken: token }, { merge: true });
        }
      } catch {
        // notifications not available
      }
    }

    init();

    const unsub = onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      if (Notification.permission === 'granted' && title) {
        new Notification(title, { body, icon: '/pwa-192.png' });
      }
    });

    return unsub;
  }, [user]);
}
