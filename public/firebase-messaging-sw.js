// Firebase Messaging Service Worker
// This file handles background notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
const firebaseConfig = {
  apiKey: "AIzaSyAgSRBVMvec3CxML8qf2RrKxGyP43DEWbs",
  authDomain: "rizaq-app-9b13f.firebaseapp.com",
  projectId: "rizaq-app-9b13f",
  storageBucket: "rizaq-app-9b13f.firebasestorage.app",
  messagingSenderId: "685567565249",
  appId: "1:685567565249:web:da7aed7ea8a7f733f5a340",
  measurementId: "G-6YFM77D5Y5"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'إشعار جديد';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      url: payload.data?.url || payload.data?.route || '/',
      ...payload.data,
    },
    tag: payload.data?.tag || 'rizaq-notification',
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);

  event.notification.close();

  // Get the URL from notification data
  const urlToOpen = event.notification.data?.url || event.notification.data?.route || '/';

  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    })
    .then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            return client.navigate(urlToOpen);
          });
        }
      }

      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

console.log('[firebase-messaging-sw.js] Service Worker initialized');

