import { useEffect, useCallback, useRef } from 'react';
import { getFCMToken, getSavedFCMToken } from '~/lib/services/fcm';
import { registerDevice } from '~/lib/services/notification';
import { getAuthUser } from '~/lib/storage/auth-storage';

const LAST_REGISTRATION_KEY = 'last_device_registration';
const REGISTRATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Hook to automatically register device with FCM token
 * Runs on mount and when user grants notification permission
 */
export function useAutoRegisterDevice() {
  const isRegistering = useRef(false);
  const hasAttempted = useRef(false);

  const attemptRegistration = useCallback(async () => {
    // Prevent multiple simultaneous registration attempts
    if (isRegistering.current || hasAttempted.current) {
      return;
    }

    // Skip if not in browser
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    // Only register if permission is granted
    if (Notification.permission !== 'granted') {
      return;
    }

    // Check if we've registered recently
    const lastRegistration = localStorage.getItem(LAST_REGISTRATION_KEY);
    if (lastRegistration) {
      const timeSinceRegistration = Date.now() - parseInt(lastRegistration, 10);
      if (timeSinceRegistration < REGISTRATION_INTERVAL) {
        console.log('Device already registered recently, skipping...');
        return;
      }
    }

    isRegistering.current = true;
    hasAttempted.current = true;

    try {
      console.log('Auto-registering device...');

      // Get or create FCM token
      let token = getSavedFCMToken();
      if (!token) {
        token = await getFCMToken();
      }

      if (!token) {
        console.warn('No FCM token available for registration');
        return;
      }

      // Get user ID
      const auth = await getAuthUser<{ userId?: number; id?: number }>();
      const userId = auth?.userId ?? auth?.id;

      if (!userId) {
        console.warn('No user ID available for device registration');
        return;
      }

      // Register device
      await registerDevice(userId);

      // Store registration timestamp
      localStorage.setItem(LAST_REGISTRATION_KEY, String(Date.now()));

      console.log('Device auto-registered successfully');
    } catch (error) {
      console.error('Failed to auto-register device:', error);
    } finally {
      isRegistering.current = false;
    }
  }, []);

  useEffect(() => {
    // Attempt registration on mount
    attemptRegistration();

    // Listen for permission changes
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Check permission every 5 seconds
      const interval = setInterval(() => {
        if (Notification.permission === 'granted' && !hasAttempted.current) {
          attemptRegistration();
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [attemptRegistration]);

  return {
    attemptRegistration,
  };
}

