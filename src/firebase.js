import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// True when config still has the REPLACE_WITH_* placeholders.
// In that case we use the localStorage-backed fallback for hooks.
export const isLocal =
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey.startsWith('REPLACE_WITH') ||
  firebaseConfig.projectId?.startsWith('REPLACE_WITH');

let app = null;
export let db = null;
export let storage = null;
export let messaging = null;

if (!isLocal) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  isSupported().then((supported) => {
    if (supported) messaging = getMessaging(app);
  });
} else {
  // eslint-disable-next-line no-console
  console.info('[firebase] running in LOCAL mode — using localStorage fallback');
}

export default app;
