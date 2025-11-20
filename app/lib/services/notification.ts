import { http } from '../utils/http';
import { getFCMToken, getSavedFCMToken } from './fcm';

const NOTIFICATIONS_STORAGE_KEY = 'rizaq_notifications';

export type NotificationAction =
  | {
      type: 'navigate';
      route: string;
      params?: Record<string, unknown>;
    }
  | {
      type: 'none';
    };

export interface StoredNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  action?: NotificationAction;
  data?: Record<string, any>;
}

export interface RegisterDeviceDto {
  token: string;
  deviceType: string;
  deviceId: string;
  deviceName: string;
  appVersion: string;
  platform: string;
}

const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

/**
 * Get device information for registration
 */
function getDeviceInfo(): Omit<RegisterDeviceDto, 'token'> {
  const userAgent = navigator.userAgent;
  const deviceId = getOrCreateDeviceId();
  const deviceName = getBrowserName();
  const appVersion = '1.0.0'; // You can get this from your package.json or env
  const platform = 'web';

  let deviceType = 'desktop';
  if (/Mobile|Android|iPhone/i.test(userAgent)) {
    deviceType = 'mobile';
  } else if (/iPad|Tablet/i.test(userAgent)) {
    deviceType = 'tablet';
  }

  return {
    deviceId,
    deviceName,
    deviceType,
    appVersion,
    platform,
  };
}

/**
 * Get or create a unique device ID
 */
function getOrCreateDeviceId(): string {
  const key = 'rizaq_device_id';
  let deviceId = localStorage.getItem(key);
  
  if (!deviceId) {
    deviceId = `web-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(key, deviceId);
  }
  
  return deviceId;
}

/**
 * Get browser name
 */
function getBrowserName(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Unknown Browser';
}

/**
 * Register device with FCM token to backend
 */
export async function registerDevice(userId: number | string): Promise<void> {
  try {
    console.log('Notification: Starting device registration for userId:', userId);

    // Get FCM token
    let fcmToken = getSavedFCMToken();
    
    if (!fcmToken) {
      console.log('Notification: No saved token, getting new FCM token...');
      fcmToken = await getFCMToken();
    }

    if (!fcmToken) {
      console.warn('Notification: No FCM token available, skipping device registration');
      return;
    }

    console.log('Notification: FCM token obtained:', fcmToken.substring(0, 20) + '...');

    // Get device information
    const deviceInfo = getDeviceInfo();
    console.log('Notification: Device info:', deviceInfo);

    // Prepare registration data
    const registrationData: RegisterDeviceDto = {
      token: fcmToken,
      ...deviceInfo,
    };

    // Register device with backend
    console.log('Notification: Registering device with backend...');
    const response = await http.post(
      `/api/notifications/devices/register?userId=${userId}`,
      registrationData
    );

    console.log('Notification: ✅ Device registered successfully:', response);
  } catch (error: any) {
    console.error('Notification: ❌ Failed to register device:', error);
    console.error('Notification: Error details:', {
      message: error?.message,
      status: error?.status,
      response: error?.response,
    });
    // Don't throw - device registration failure shouldn't block login
  }
}

/**
 * Read stored notifications from localStorage
 */
function readStoredNotifications(): StoredNotification[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.warn('Failed to read stored notifications', error);
    return [];
  }
}

/**
 * Write stored notifications to localStorage
 */
function writeStoredNotifications(notifications: StoredNotification[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.warn('Failed to persist notifications', error);
  }
}

/**
 * Add a new notification to storage
 */
export function addStoredNotification(notification: {
  id?: string;
  title: string;
  message: string;
  action?: NotificationAction;
  read?: boolean;
  data?: Record<string, any>;
}): StoredNotification {
  const existing = readStoredNotifications();
  const newNotification: StoredNotification = {
    id: notification.id ?? generateId(),
    title: notification.title,
    message: notification.message,
    createdAt: new Date().toISOString(),
    read: notification.read ?? false,
    action: notification.action,
    data: notification.data,
  };

  writeStoredNotifications([newNotification, ...existing]);
  return newNotification;
}

/**
 * Get all stored notifications
 */
export function getStoredNotifications(): StoredNotification[] {
  return readStoredNotifications();
}

/**
 * Mark notification as read
 */
export function markNotificationAsRead(id: string): void {
  const notifications = readStoredNotifications();
  const updated = notifications.map((notification) =>
    notification.id === id ? { ...notification, read: true } : notification
  );
  writeStoredNotifications(updated);
}

/**
 * Remove a notification
 */
export function removeNotification(id: string): void {
  const notifications = readStoredNotifications();
  const filtered = notifications.filter((notification) => notification.id !== id);
  writeStoredNotifications(filtered);
}

/**
 * Clear all notifications
 */
export function clearNotifications(): void {
  writeStoredNotifications([]);
}

/**
 * Get unread notification count
 */
export function getUnreadCount(): number {
  const notifications = readStoredNotifications();
  return notifications.filter(n => !n.read).length;
}

/**
 * Resolve navigation params from notification action
 */
export function resolveNavigationParams(action?: NotificationAction): {
  route: string;
  params?: Record<string, unknown>;
} | undefined {
  if (!action || action.type !== 'navigate') {
    return undefined;
  }

  return {
    route: action.route,
    params: action.params,
  };
}

