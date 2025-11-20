import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAgSRBVMvec3CxML8qf2RrKxGyP43DEWbs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "rizaq-app-9b13f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rizaq-app-9b13f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "rizaq-app-9b13f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "685567565249",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:685567565249:web:da7aed7ea8a7f733f5a340",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-6YFM77D5Y5"
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export function initializeFirebase(): FirebaseApp {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!messaging) {
    try {
      const firebaseApp = initializeFirebase();
      messaging = getMessaging(firebaseApp);
    } catch (error) {
      console.error('Error initializing Firebase Messaging:', error);
      return null;
    }
  }

  return messaging;
}

export { firebaseConfig };

