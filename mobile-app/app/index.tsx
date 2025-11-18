import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
    useEffect(() => {
        checkIntroStatus();
    }, []);

    const checkIntroStatus = async () => {
        try {
            const hasSeenIntro = await AsyncStorage.getItem('hasSeenIntro');

            // Small delay to prevent flash
            setTimeout(() => {
                if (hasSeenIntro === 'true') {
                    router.replace('/(tabs)');
                } else {
                    router.replace('/intro');
                }
            }, 100);
        } catch (error) {
            console.error('Error checking intro status:', error);
            // Default to showing intro on error
            router.replace('/intro');
        }
    };

    return (
        <View className="flex-1 items-center justify-center bg-white">
            <ActivityIndicator size="large" color="#15803d" />
        </View>
    );
}

