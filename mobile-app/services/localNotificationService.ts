import AsyncStorage from '@react-native-async-storage/async-storage';
// Avoid importing expo-notifications at module load time to prevent Expo Go push-token errors
// We'll dynamically import when actually scheduling or checking permissions
type ExpoNotificationsModule = typeof import('expo-notifications');
let Notifications: ExpoNotificationsModule | null = null;
async function getNotifications(): Promise<ExpoNotificationsModule | null> {
  if (Notifications) return Notifications;
  try {
    const mod = await import('expo-notifications');
    Notifications = mod;
    return mod;
  } catch (e) {
    console.warn('expo-notifications not available in this environment', e);
    return null;
  }
}

const STORAGE_KEY = '@rizaq-app/local-notifications';

export type NotificationAction =
  | {
      type: 'navigate';
      route: string;
      params?: Record<string, unknown>;
    }
  | {
      type: 'none';
    };

export interface NotificationRequest {
  title: string;
  body: string;
  seconds?: number;
  sound?: 'default' | 'defaultCritical' | 'custom' | null;
  channelId?: string;
  data?: Record<string, unknown>;
  action?: NotificationAction;
}

export interface StoredNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  action?: NotificationAction;
  expoNotificationId?: string;
}

const defaultChannel = 'default';

const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

async function readStoredNotifications(): Promise<StoredNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
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

async function writeStoredNotifications(notifications: StoredNotification[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.warn('Failed to persist notifications', error);
  }
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  try {
    const Noti = await getNotifications();
    if (!Noti) return false;
    const { status: existingStatus } = await Noti.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Noti.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Unable to check notification permissions', error);
    return false;
  }
}

async function buildTrigger(seconds?: number, channelId?: string) {
  const Noti = await getNotifications();
  if (!Noti) return null as any;
  if (seconds === undefined) {
    return channelId ? { channelId } : null;
  }

  if (seconds <= 0) {
    return channelId ? { channelId } : null;
  }

  return {
    type: (Noti as any).SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds,
    repeats: false,
    ...(channelId ? { channelId } : {}),
  };
}

export async function pushLocalNotification(request: NotificationRequest): Promise<StoredNotification | undefined> {
  const hasPermission = await ensureNotificationPermissions();
  if (!hasPermission) {
    return undefined;
  }

  const Noti = await getNotifications();
  if (!Noti) return undefined;
  const trigger = await buildTrigger(request.seconds, request.channelId ?? defaultChannel);

  const expoNotificationId = await Noti.scheduleNotificationAsync({
    content: {
      title: request.title,
      body: request.body,
      sound: request.sound ?? 'default',
      data: {
        ...request.data,
        action: request.action,
      },
    },
    trigger,
  });

  const stored = await addStoredNotification({
    title: request.title,
    message: request.body,
    action: request.action,
    expoNotificationId,
  });

  return stored;
}

export async function addStoredNotification(notification: {
  id?: string;
  title: string;
  message: string;
  action?: NotificationAction;
  read?: boolean;
  expoNotificationId?: string;
}): Promise<StoredNotification> {
  const existing = await readStoredNotifications();
  const newNotification: StoredNotification = {
    id: notification.id ?? generateId(),
    title: notification.title,
    message: notification.message,
    createdAt: new Date().toISOString(),
    read: notification.read ?? false,
    action: notification.action,
    expoNotificationId: notification.expoNotificationId,
  };

  await writeStoredNotifications([newNotification, ...existing]);
  return newNotification;
}

export async function getStoredNotifications(): Promise<StoredNotification[]> {
  return readStoredNotifications();
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const notifications = await readStoredNotifications();
  const updated = notifications.map((notification) =>
    notification.id === id ? { ...notification, read: true } : notification,
  );
  await writeStoredNotifications(updated);
}

export async function removeNotification(id: string): Promise<void> {
  const notifications = await readStoredNotifications();
  const filtered = notifications.filter((notification) => notification.id !== id);
  await writeStoredNotifications(filtered);
}

export async function clearNotifications(): Promise<void> {
  await writeStoredNotifications([]);
}

export function getActionFromNotification(notification: StoredNotification): NotificationAction | undefined {
  return notification.action;
}

export function resolveNavigationParams(action?: NotificationAction): {
  route: string;
  params?: Record<string, unknown>;
} | undefined {
  if (!action) {
    return undefined;
  }

  if (action.type === 'navigate') {
    return {
      route: action.route,
      params: action.params,
    };
  }

  return undefined;
}


