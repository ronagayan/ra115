importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyDKMtM9gsoxPtCmmP37_1v38yzzjhRXtgM',
  authDomain: 'ra115-a013e.firebaseapp.com',
  projectId: 'ra115-a013e',
  storageBucket: 'ra115-a013e.firebasestorage.app',
  messagingSenderId: '939753877070',
  appId: '1:939753877070:web:7da9bb4ca5f752cf2b1d1f',
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title = '💚', body = 'הודעה חדשה' } = payload.notification || {};
  self.registration.showNotification(title, {
    body,
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    vibrate: [200, 100, 200],
  });
});
