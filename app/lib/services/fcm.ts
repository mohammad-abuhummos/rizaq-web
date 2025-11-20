import { getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { getMessagingInstance } from '../utils/firebase';

const FCM_TOKEN_STORAGE_KEY = 'fcm_token';
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY_HERE';

/**
 * Request notification permission from the browser
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('FCM: This browser does not support notifications');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('FCM: Notification permission granted');
      return true;
    } else {
      console.log('FCM: Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('FCM: Error requesting permission:', error);
    return false;
  }
}

/**
 * Get FCM token for the browser
 */
export async function getFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    console.warn('FCM: Not in browser environment');
    return null;
  }

  if (!('Notification' in window)) {
    console.warn('FCM: Notifications not supported');
    return null;
  }

  try {
    // Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.error('FCM: Permission not granted, cannot get token');
      return null;
    }

    // Get messaging instance
    const messaging = getMessagingInstance();
    if (!messaging) {
      console.error('FCM: Messaging instance not available');
      return null;
    }

    // Get token
    console.log('FCM: Getting token...');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    if (token) {
      // Save to storage
      localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
      console.log('FCM: ✅ Token retrieved and saved');
      console.log('FCM: Token:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('FCM: No token available');
      return null;
    }
  } catch (error: any) {
    console.error('FCM: Error getting token:', error);
    console.error('FCM: Error details:', {
      message: error?.message,
      code: error?.code,
    });
    return null;
  }
}

/**
 * Get saved FCM token from storage
 */
export function getSavedFCMToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error('FCM: Error reading saved token:', error);
    return null;
  }
}

/**
 * Delete FCM token from storage
 */
export function deleteFCMToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
    console.log('FCM: Token deleted from storage');
  } catch (error) {
    console.error('FCM: Error deleting token:', error);
  }
}

/**
 * Setup foreground message listener
 */
export function setupForegroundMessageListener(
  callback: (payload: MessagePayload) => void
): (() => void) | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const messaging = getMessagingInstance();
  if (!messaging) {
    console.error('FCM: Cannot setup message listener - messaging not available');
    return null;
  }

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('FCM: Foreground message received:', payload);
      callback(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error('FCM: Error setting up message listener:', error);
    return null;
  }
}

/**
 * Initialize FCM on app startup
 */
export async function initializeFCM(): Promise<void> {
  if (typeof window === 'undefined') {
    console.log('FCM: Not in browser, skipping initialization');
    return;
  }

  if (!('Notification' in window)) {
    console.log('FCM: Notifications not supported in this browser');
    return;
  }

  try {
    console.log('FCM: Starting initialization...');

    // Check if we already have a token
    const savedToken = getSavedFCMToken();
    if (savedToken) {
      console.log('FCM: Found saved token');
      return;
    }

    // Get new token if user has already granted permission
    if (Notification.permission === 'granted') {
      console.log('FCM: Permission already granted, getting token...');
      await getFCMToken();
    } else {
      console.log('FCM: Permission not yet granted. Token will be requested when user grants permission.');
    }
  } catch (error) {
    console.error('FCM: Error during initialization:', error);
  }
}

