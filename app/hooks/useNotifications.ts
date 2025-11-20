import { useEffect, useCallback, useState } from 'react';
import { setupForegroundMessageListener, initializeFCM } from '~/lib/services/fcm';
import { addStoredNotification, getUnreadCount, type NotificationAction } from '~/lib/services/notification';
import type { MessagePayload } from 'firebase/messaging';

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  // Update unread count
  const updateUnreadCount = useCallback(() => {
    const count = getUnreadCount();
    setUnreadCount(count);
  }, []);

  // Handle foreground messages
  const handleForegroundMessage = useCallback((payload: MessagePayload) => {
    console.log('Foreground message received:', payload);

    // Extract notification data
    const title = payload.notification?.title || payload.data?.title || 'إشعار جديد';
    const message = payload.notification?.body || payload.data?.body || '';
    
    // Parse action if provided
    let action: NotificationAction | undefined;
    if (payload.data?.route) {
      action = {
        type: 'navigate',
        route: payload.data.route as string,
        params: payload.data?.params ? JSON.parse(payload.data.params as string) : undefined,
      };
    }

    // Store notification
    addStoredNotification({
      title,
      message,
      action,
      data: payload.data,
    });

    // Update unread count
    updateUnreadCount();

    // Show browser notification if permission is granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'rizaq-notification',
          requireInteraction: false,
        });
      } catch (error) {
        console.warn('Failed to show notification:', error);
      }
    }
  }, [updateUnreadCount]);

  // Initialize
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (!supported) {
      console.log('Notifications not supported in this browser');
      return;
    }

    // Initialize FCM
    initializeFCM().catch(error => {
      console.error('Failed to initialize FCM:', error);
    });

    // Setup foreground message listener
    const unsubscribe = setupForegroundMessageListener(handleForegroundMessage);

    // Update unread count on mount
    updateUnreadCount();

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [handleForegroundMessage, updateUnreadCount]);

  return {
    unreadCount,
    isSupported,
    updateUnreadCount,
  };
}

