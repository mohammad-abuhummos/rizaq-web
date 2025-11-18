import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox, Platform } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import GlobalErrorBottomSheet from '@/components/ui/global-error-bottom-sheet';

import "./global.css";
// Lazily import expo-notifications to avoid Expo Go remote push crash
type ExpoNotificationsModule = typeof import('expo-notifications');
let Notifications: ExpoNotificationsModule | null = null;
async function getNotifications(): Promise<ExpoNotificationsModule | null> {
  if (Notifications) return Notifications;
  try {
    const mod = await import('expo-notifications');
    Notifications = mod;
    return mod;
  } catch (e) {
    console.warn('expo-notifications unavailable in this environment');
    return null;
  }
}

// Ignore SafeAreaView deprecation warning coming from dependencies
LogBox.ignoreLogs(["SafeAreaView has been deprecated and will be removed"]);

// Configure notification handler lazily inside effect (and skip in Expo Go)

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Cairo: require('../assets/app/fonts/Cairo-Regular.ttf'),
    'Cairo-Bold': require('../assets/app/fonts/Cairo-Bold.ttf'),
    'Cairo-SemiBold': require('../assets/app/fonts/Cairo-SemiBold.ttf'),
    'Cairo-Light': require('../assets/app/fonts/Cairo-Light.ttf'),
    'Cairo-Medium': require('../assets/app/fonts/Cairo-Medium.ttf'),
    'Cairo-ExtraBold': require('../assets/app/fonts/Cairo-ExtraBold.ttf'),
    'Cairo-ExtraLight': require('../assets/app/fonts/Cairo-ExtraLight.ttf'),
    'Cairo-Black': require('../assets/app/fonts/Cairo-Black.ttf'),
  });

  // Setup notifications only on dev client/standalone (skip Expo Go)
  useEffect(() => {
    if (Constants.appOwnership === 'expo') return;
    let mounted = true;
    (async () => {
      try {
        const Noti = await getNotifications();
        if (!mounted || !Noti) return;
        Noti.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
      } catch { }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (Constants.appOwnership === 'expo') return;
    if (Platform.OS !== 'android') return;
    (async () => {
      try {
        const Noti = await getNotifications();
        if (!Noti) return;
        await Noti.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Noti.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#16a34a',
        });
      } catch (error) {
        console.warn('Failed to configure notification channel', error);
      }
    })();
  }, []);

  // Initialize Firebase Cloud Messaging (Android only)
  // Uses expo-notifications - requires development build (NOT Expo Go SDK 53+)
  useEffect(() => {
    console.log('FCM: useEffect triggered, appOwnership:', Constants.appOwnership, 'Platform:', Platform.OS);
    // Expo Go cannot use remote push (FCM); skip to avoid red error screen
    if (Constants.appOwnership === 'expo') {
      console.log('FCM: Running in Expo Go, skipping FCM initialization (remote push not supported)');
      return;
    }
    if (Platform.OS !== 'android') {
      console.log('FCM: Skipping (not Android)');
      return;
    }
    let mounted = true;
    (async () => {
      try {
        console.log('FCM: Importing fcmService...');
        const fcmService = await import('@/services/fcmService');
        if (!mounted) {
          console.log('FCM: Component unmounted, aborting');
          return;
        }
        console.log('FCM: Calling initializeFCM...');
        await fcmService.initializeFCM();
      } catch (error: any) {
        console.error('FCM: Failed to initialize FCM:', error);
        console.error('FCM: Error message:', error?.message);
        console.error('FCM: Error stack:', error?.stack);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  // i18n initialized at startup in index.js

  return (
    <SafeAreaProvider>
      <ThemeProvider value={DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="no-internet" options={{ headerShown: false }} />
          <Stack.Screen name="intro" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="auction" options={{ title: 'Auction' }} />
          <Stack.Screen name="registration" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="dark" />
        <GlobalErrorBottomSheet />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
