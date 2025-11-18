import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const FCM_TOKEN_STORAGE_KEY = 'fcm_token';

// Lazy import expo-notifications to avoid crashes in Expo Go
type ExpoNotificationsModule = typeof import('expo-notifications');
let Notifications: ExpoNotificationsModule | null = null;

async function getNotifications(): Promise<ExpoNotificationsModule | null> {
  if (Notifications) return Notifications;
  try {
    // Expo Go (appOwnership === 'expo') no longer supports remote push notifications.
    // Avoid importing expo-notifications there to prevent the red error screen.
    if (Constants.appOwnership === 'expo') {
      console.warn('FCM: Skipping expo-notifications import in Expo Go (remote push not supported)');
      return null;
    }

    const mod = await import('expo-notifications');
    Notifications = mod;
    return mod;
  } catch (e) {
    console.warn('FCM: expo-notifications unavailable:', e);
    return null;
  }
}

/**
 * Request notification permissions (required for FCM on Android)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  // Remote push permissions are not available in Expo Go (SDK 53+)
  if (Constants.appOwnership === 'expo') {
    console.log('FCM: Skipping permission request in Expo Go (remote push not supported)');
    return false;
  }

  try {
    const notificationsModule = await getNotifications();
    if (!notificationsModule) {
      console.warn('FCM: Notifications module not available');
      return false;
    }

    const { status: existingStatus } = await notificationsModule.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If permission not granted, request it
    if (existingStatus !== notificationsModule.PermissionStatus.GRANTED) {
      const { status } = await notificationsModule.requestPermissionsAsync();
      finalStatus = status;
    }

    const granted = finalStatus === notificationsModule.PermissionStatus.GRANTED;

    if (granted) {
      console.log('FCM: Notification permission granted');
    } else {
      console.log('FCM: Notification permission denied');
    }

    return granted;
  } catch (error) {
    console.error('FCM: Error requesting permission:', error);
    return false;
  }
}

/**
 * Get the FCM token and save it to storage
 * Uses expo-notifications (requires development build, not Expo Go)
 */
export async function getFCMToken(): Promise<string | null> {
  if (Platform.OS !== 'android') {
    console.log('FCM: Not supported on this platform');
    return null;
  }

  // Remote push (FCM token) is not available in Expo Go SDK 53+
  if (Constants.appOwnership === 'expo') {
    console.log('FCM: Running in Expo Go, skipping getFCMToken (remote push not supported)');
    return null;
  }

  try {
    console.log('FCM: Getting notifications module...');
    const notificationsModule = await getNotifications();
    if (!notificationsModule) {
      console.error('FCM: Notifications module not available');
      return null;
    }
    console.log('FCM: Notifications module obtained');

    // Request permission first
    console.log('FCM: Requesting notification permission...');
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.error('FCM: Permission not granted, cannot get token');
      return null;
    }
    console.log('FCM: Permission granted');

    // Get the device push token (FCM token on Android)
    // NOTE: This requires a development build - doesn't work in Expo Go (SDK 53+)
    console.log('FCM: Calling getDevicePushTokenAsync()...');
    const tokenData = await notificationsModule.getDevicePushTokenAsync();
    console.log('FCM: getDevicePushTokenAsync() returned:', tokenData ? 'Token received' : 'No token');
    console.log('FCM: Token data structure:', JSON.stringify(tokenData, null, 2));
    
    // Extract the token from the response
    // On Android, getDevicePushTokenAsync returns: { type: 'fcm', data: 'token-string' }
    let token: string | null = null;
    
    if (tokenData) {
      if (typeof tokenData === 'string') {
        token = tokenData;
      } else if (typeof tokenData === 'object' && 'data' in tokenData) {
        token = String(tokenData.data);
      }
    }
    
    if (token) {
      // Save to storage
      await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
      console.log('FCM: ✅ Token retrieved and saved to storage');
      console.log('FCM: Token value:', token);
      return token;
    } else {
      console.warn('FCM: ⚠️ No token available from getDevicePushTokenAsync()');
      console.warn('FCM: Token data received:', JSON.stringify(tokenData));
      return null;
    }
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    
    // Check if this is the Expo Go error
    if (errorMessage.includes('removed from Expo Go') || errorMessage.includes('development build')) {
      console.warn('FCM: ⚠️ Push notifications are not available in Expo Go (SDK 53+)');
      console.warn('FCM: To get FCM token, you need to create a development build:');
      console.warn('FCM: Run: npm run android (or expo run:android)');
      console.warn('FCM: Or use EAS Build to create a development build');
      return null;
    }
    
    console.error('FCM: ❌ Error getting token:', error);
    console.error('FCM: Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    return null;
  }
}

/**
 * Get the saved FCM token from storage
 */
export async function getSavedFCMToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(FCM_TOKEN_STORAGE_KEY);
    return token;
  } catch (error) {
    console.error('FCM: Error reading saved token:', error);
    return null;
  }
}

/**
 * Initialize FCM and get token on app startup
 * Requires a development build (does NOT work in Expo Go SDK 53+)
 */
export async function initializeFCM(): Promise<void> {
  console.log('FCM: initializeFCM called, Platform.OS:', Platform.OS);

  // Skip entirely in Expo Go to avoid expo-notifications remote push error
  if (Constants.appOwnership === 'expo') {
    console.log('FCM: Running in Expo Go, skipping FCM initialization (remote push not supported)');
    return;
  }
  
  if (Platform.OS !== 'android') {
    console.log('FCM: Initialization skipped (not Android)');
    return;
  }

  try {
    console.log('FCM: Starting initialization with expo-notifications...');
    
    // Load notifications module
    const notificationsModule = await getNotifications();
    console.log('FCM: Notifications module loaded:', !!notificationsModule);
    
    if (!notificationsModule) {
      console.error('FCM: Notifications module not available');
      return;
    }

    console.log('FCM: Notifications module loaded successfully');
    
    // Small delay to ensure everything is ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get and save the token
    // This will fail gracefully in Expo Go with a helpful message
    console.log('FCM: Attempting to get token...');
    const token = await getFCMToken();
    
    if (token) {
      console.log('FCM: ✅ Initialization successful!');
      console.log('FCM: ✅ FCM Token:', token);
    } else {
      // Error message already logged in getFCMToken()
      console.log('FCM: Token retrieval completed (may have failed if running in Expo Go)');
    }

    // Set up token refresh listener
    // expo-notifications doesn't have onTokenRefresh, so we'll check on app focus
    // You can call getFCMToken() again when needed (e.g., on app focus)

  } catch (error: any) {
    console.error('FCM: ❌ Error during initialization:', error);
    console.error('FCM: Error message:', error?.message);
    console.error('FCM: Error stack:', error?.stack);
  }
}

/**
 * Delete the FCM token (e.g., on logout)
 * Note: expo-notifications doesn't provide a delete token method
 * This just removes it from local storage
 */
export async function deleteFCMToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
    console.log('FCM: Token deleted from storage');
  } catch (error) {
    console.error('FCM: Error deleting token:', error);
  }
}
