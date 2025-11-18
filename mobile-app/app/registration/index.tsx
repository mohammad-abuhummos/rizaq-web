import { useRegistrationSession } from '@/hooks/useRegistrationSession';
import { getAuthToken } from '@/storage/auth-storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

export default function RegistrationLoadingScreen() {
    const router = useRouter();
    const { loading, error, status, startOrResume } = useRegistrationSession();
    const [authChecked, setAuthChecked] = useState(false);
    const [hasToken, setHasToken] = useState(false);

    useEffect(() => {
        getAuthToken().then((t) => {
            setHasToken(!!t);
            setAuthChecked(true);
        });
    }, []);

    useEffect(() => {
        if (!authChecked) return;
        if (hasToken) return; // don't start registration while logged in
        startOrResume();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authChecked, hasToken]);

    useEffect(() => {
        if (error || hasToken) return; // could show an error UI here
        if (!loading && status && !hasToken) {
            const step = status.currentStep;
            if (step <= 1) {
                if (status.otpVerified) router.replace('/registration/role');
                else if (status.accountFilled) router.replace('/registration/otp');
                else router.replace('/registration/step1');
            } else if (step === 2) {
                router.replace('/registration/role');
            } else if (step === 3) {
                router.replace('/registration/details');
            } else if (step === 4) {
                router.replace('/registration/documents');
            } else if (step >= 5) {
                // If already completed (step 7), go home. Otherwise payout.
                if (status.isCompleted) router.replace('/(tabs)');
                else router.replace('/registration/payout');
            }
        }
    }, [loading, status, error, router, hasToken]);

    if (!authChecked) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 bg-white items-center justify-center">
                    <ActivityIndicator size="large" color="#065f46" />
                    <Text className="mt-4 text-gray-600 text-lg" style={{ fontFamily: 'Cairo-Regular' }}>
                        جاري التحميل...
                    </Text>
                </View>
            </>
        );
    }

    if (hasToken) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 bg-white items-center justify-center p-6">
                    <View className="bg-green-50 p-6 rounded-2xl mb-6 w-full max-w-md">
                        <Text
                            className="text-xl text-center mb-4 text-gray-800"
                            style={{ fontFamily: 'Cairo-SemiBold' }}
                        >
                            أنت مسجل دخول بالفعل
                        </Text>
                        <Text
                            className="text-base text-center text-gray-600"
                            style={{ fontFamily: 'Cairo-Regular' }}
                        >
                            لا يمكنك التسجيل أثناء تسجيل الدخول
                        </Text>
                    </View>

                    <View className="w-full max-w-md gap-4">
                        <TouchableOpacity
                            className="bg-green-700 py-4 rounded-xl"
                            onPress={() => router.replace('/(tabs)')}
                        >
                            <Text
                                className="text-white text-center text-lg font-bold"
                                style={{ fontFamily: 'Cairo-SemiBold' }}
                            >
                                الذهاب للرئيسية
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="border-2 border-green-700 py-4 rounded-xl"
                            onPress={() => router.replace('/logout')}
                        >
                            <Text
                                className="text-green-700 text-center text-lg font-bold"
                                style={{ fontFamily: 'Cairo-SemiBold' }}
                            >
                                تسجيل الخروج
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#065f46" />
                <Text className="mt-4 text-gray-600 text-lg" style={{ fontFamily: 'Cairo-Regular' }}>
                    جاري تحميل التسجيل...
                </Text>
            </View>
        </>
    );
}


