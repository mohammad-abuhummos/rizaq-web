import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { http } from '@/utils/http';
import { getFCMToken, getSavedFCMToken } from './fcmService';

export interface RegisterDeviceDto {
  token: string;
  deviceType: string;
  deviceId: string;
  deviceName: string;
  appVersion: string;
  platform: string;
}

/**
 * Get device information for registration
 */
async function getDeviceInfo() {
  // Use a unique device identifier
  // For Android, we can use a combination or generate a unique ID
  // In production, you might want to use expo-application's installationId
  const deviceId = Device.modelId || Device.deviceName || `${Platform.OS}-${Date.now()}`;
  const deviceName = Device.deviceName || Device.modelName || 'Unknown Device';
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const platform = Platform.OS;

  return {
    deviceId: String(deviceId),
    deviceName: String(deviceName),
    deviceType: Device.deviceType === Device.DeviceType.PHONE ? 'phone' : 
                Device.deviceType === Device.DeviceType.TABLET ? 'tablet' : 
                'unknown',
    appVersion: String(appVersion),
    platform: platform === 'ios' ? 'ios' : 'android',
  };
}

/**
 * Register device with FCM token to backend
 */
export async function registerDevice(userId: number | string): Promise<void> {
  try {
    console.log('Notification: Starting device registration for userId:', userId);

    // Get FCM token (try saved first, then get new one)
    let fcmToken = await getSavedFCMToken();
    
    if (!fcmToken) {
      console.log('Notification: No saved token, attempting to get new FCM token...');
      fcmToken = await getFCMToken();
    }

    if (!fcmToken) {
      console.warn('Notification: ⚠️ No FCM token available, skipping device registration');
      console.warn('Notification: Device registration requires FCM token (development build needed)');
      return;
    }

    console.log('Notification: FCM token obtained:', fcmToken.substring(0, 20) + '...');

    // Get device information
    const deviceInfo = await getDeviceInfo();
    console.log('Notification: Device info:', deviceInfo);

    // Prepare registration data
    const registrationData: RegisterDeviceDto = {
      token: fcmToken,
      deviceType: deviceInfo.deviceType,
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      appVersion: deviceInfo.appVersion,
      platform: deviceInfo.platform,
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

