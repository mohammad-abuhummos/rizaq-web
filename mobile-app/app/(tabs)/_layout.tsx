import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import "../global.css";

export default function TabLayout() {
  // const router = useRouter();
  const insets = useSafeAreaInsets();

  // useEffect(() => {
  //   const delay = Math.random() * 1000 + 3000;
  //   const timeoutId = setTimeout(() => {
  //     router.replace('/no-internet');
  //   }, delay);

  //   return () => clearTimeout(timeoutId);
  // }, [router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        lazy: true,
        detachInactiveScreens: true,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          overflow: 'hidden',
          paddingBottom: Math.max(insets.bottom, 2),
          paddingTop: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Cairo-SemiBold',
        },
      }}>
      <Tabs.Screen
        name="account"
        options={{
          title: 'الحسابات',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'الاشعارات',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name="notifications" size={24} color={color} />
              {/* Notification badge */}
              <View
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -10,
                  backgroundColor: '#ef4444',
                  borderRadius: 10,
                  minWidth: 18,
                  height: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <Text style={{ color: 'white', fontSize: 10, fontFamily: 'Cairo-Bold' }}>0</Text>
              </View>
            </View>
          ),
        }}
      />
      {/* <Tabs.Screen
        name="operations"
        options={{
          title: 'عملياتي',
          tabBarIcon: ({ color }) => <Ionicons name="pulse" size={24} color={color} />,
        }}
      /> */}
      <Tabs.Screen
        name="messages"
        options={{
          title: 'المحادثات',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
      {/* <Tabs.Screen
        name="home"
        options={{
          href: null,
        }}
      /> */}
    </Tabs>
  );
}
