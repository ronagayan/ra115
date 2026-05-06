export const ANNIVERSARY_DATE = new Date('2024-05-11'); // ← תאריך אמיתי!

export const TOKENS = {
  her: 'amit-2y-green-jar', // ← לינק לעמית
  him: 'rona-2y-green-jar', // ← לינק שלך
};

export const firebaseConfig = {
  apiKey: 'AIzaSyDKMtM9gsoxPtCmmP37_1v38yzzjhRXtgM',
  authDomain: 'ra115-a013e.firebaseapp.com',
  projectId: 'ra115-a013e',
  storageBucket: 'ra115-a013e.firebasestorage.app',
  messagingSenderId: '939753877070',
  appId: '1:939753877070:web:7da9bb4ca5f752cf2b1d1f',
  measurementId: 'G-6WXZ866LVD',
};

// Optional — for FCM push notifications.
// Generate at Firebase Console → Project Settings → Cloud Messaging → Web push certificates
export const VAPID_KEY = 'REPLACE_WITH_VAPID_KEY';
