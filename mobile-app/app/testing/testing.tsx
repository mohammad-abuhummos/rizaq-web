import { Image } from 'expo-image';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import { LanguageToggle } from '@/components/language-toggle';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { pushLocalNotification } from '@/services/localNotificationService';
import { getAuthToken } from '@/storage/auth-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function HomeScreen() {
  const { t } = useTranslation();
  const [hasToken, setHasToken] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const [schedulingNotification, setSchedulingNotification] = useState(false);

  useEffect(() => {
    getAuthToken().then((t) => setHasToken(!!t));
  }, []);

  const resetIntro = async () => {
    try {
      await AsyncStorage.removeItem('hasSeenIntro');
      Alert.alert(
        'تم إعادة تعيين الشاشات التعريفية',
        'سيتم إعادة توجيهك إلى الشاشات التعريفية',
        [
          {
            text: 'موافق',
            onPress: () => router.replace('/intro'),
          },
        ]
      );
    } catch {
      Alert.alert('خطأ', 'حدث خطأ أثناء إعادة التعيين');
    }
  };

  const handleTestLocalNotification = async () => {
    setTestingNotification(true);
    try {
      const stored = await pushLocalNotification({
        title: '🔔 إشعار ريزاق التجريبي',
        body: 'هذا إشعار محلي للتجربة باستخدام شعار التطبيق.',
        seconds: Platform.OS === 'android' ? 1 : undefined,
        action: {
          type: 'navigate',
          route: '/(tabs)/notifications',
        },
      });

      if (!stored) {
        Alert.alert('إذن الإشعارات مرفوض', 'يرجى تفعيل الإشعارات من إعدادات النظام.');
        return;
      }

      Alert.alert('تم', 'تم إرسال الإشعار المحلي بنجاح.');
    } catch (error) {
      console.error('Local notification test failed', error);
      Alert.alert('خطأ', 'تعذر إرسال الإشعار المحلي. حاول مرة أخرى.');
    } finally {
      setTestingNotification(false);
    }
  };

  const handleScheduleNotificationInMinute = async () => {
    setSchedulingNotification(true);
    try {
      const stored = await pushLocalNotification({
        title: '⏱️ إشعار مجدول من ريزاق',
        body: 'سيصلك هذا الإشعار بعد دقيقة واحدة من الآن.',
        seconds: 60,
        action: {
          type: 'navigate',
          route: '/(tabs)/notifications',
          params: {
            fromScheduled: true,
          },
        },
      });

      if (!stored) {
        Alert.alert('إذن الإشعارات مرفوض', 'يرجى تفعيل الإشعارات من إعدادات النظام.');
        return;
      }

      Alert.alert('تم', 'تمت جدولة الإشعار وسيصل بعد دقيقة واحدة.');
    } catch (error) {
      console.error('Scheduled notification test failed', error);
      Alert.alert('خطأ', 'تعذر جدولة الإشعار المحلي. حاول مرة أخرى.');
    } finally {
      setSchedulingNotification(false);
    }
  };
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <Text className="text-2xl text-green-500 font-cairo">{t('welcome')}</Text>
        <HelloWave />
      </ThemedView>
      <View style={{ alignItems: 'flex-end', flexDirection: 'column', gap: 8, justifyContent: 'flex-end', paddingBottom: 24 }}>
        <TouchableOpacity
          onPress={handleTestLocalNotification}
          disabled={testingNotification}
          style={{
            backgroundColor: '#f97316',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            opacity: testingNotification ? 0.6 : 1,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>
            {testingNotification ? 'جاري إرسال الإشعار...' : 'اختبار الإشعار المحلي'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleScheduleNotificationInMinute}
          disabled={schedulingNotification}
          style={{
            backgroundColor: '#ea580c',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            opacity: schedulingNotification ? 0.6 : 1,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>
            {schedulingNotification ? 'جاري جدولة الإشعار...' : 'جدولة إشعار بعد دقيقة'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={resetIntro}
          style={{
            backgroundColor: '#15803d',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>إعادة الشاشات التعريفية</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)' as any)}
          style={{
            backgroundColor: '#14532d',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>الصفحة الرئيسية</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/registration' as any)}
          style={{
            backgroundColor: '#166534',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>بدء التسجيل</Text>
        </TouchableOpacity>
        {!hasToken ? (
          <TouchableOpacity
            onPress={() => router.push('/login' as any)}
            style={{
              backgroundColor: '#0ea5e9',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Login</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/logout' as any)}
            style={{
              backgroundColor: '#ef4444',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Logout</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => router.push('/farms/create' as any)}
          style={{
            backgroundColor: '#84cc16',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Create Farm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/auctions/create' as any)}
          style={{
            backgroundColor: '#22c55e',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Create Auction</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/auction' as any)}
          style={{
            backgroundColor: '#0e7490',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>المزاد</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/profile' as any)}
          style={{
            backgroundColor: '#2563eb',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/market-analysis' as any)}
          style={{
            backgroundColor: '#7c3aed',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>تحليلات السوق</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/transport' as any)}
          style={{
            backgroundColor: '#7c3aed',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>transport</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('testing/direct' as any)}
          style={{
            backgroundColor: '#7c3aed',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>transport</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/testing/chat' as any)}
          style={{
            backgroundColor: '#1f2937',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Chat Tester</Text>
        </TouchableOpacity>
        <LanguageToggle />
      </View>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
      <View style={{ height: 1, backgroundColor: '#e5e7eb', marginVertical: 16 }} />
    </ParallaxScrollView>
  );
}

// Chat test UI moved to a dedicated screen: /testing/chat

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
