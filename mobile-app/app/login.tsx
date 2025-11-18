import { login } from '@/services/auth';
import { registerDevice } from '@/services/notificationService';
import { getAuthToken, saveAuthToken } from '@/storage/auth-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        getAuthToken().then((t) => setAlreadyLoggedIn(!!t));
    }, []);

    const onSubmit = async () => {
        if (!emailOrPhone || !password) {
            Alert.alert('خطأ', 'الرجاء إدخال البريد الإلكتروني/الهاتف وكلمة المرور');
            return;
        }
        setSubmitting(true);
        try {
            const res = await login({ emailOrPhone, password });
            const token = (res as any)?.data?.token || (res as any)?.token;
            if (token) await saveAuthToken(token);

            // Extract userId from login response (same structure as auth.ts)
            const innerData = (res as any)?.data?.data || (res as any)?.data || (res as any);
            const userId = innerData?.userId || innerData?.user?.userId || innerData?.user?.id;

            // Also try to get userId from saved user data
            const { getAuthUser } = await import('@/storage/auth-storage');
            const savedUser = await getAuthUser();
            const finalUserId = userId || savedUser?.userId || savedUser?.id;

            // Register device with FCM token (non-blocking)
            if (finalUserId) {
                registerDevice(finalUserId).catch((error) => {
                    console.error('Failed to register device:', error);
                    // Don't show error to user - device registration is not critical for login
                });
            } else {
                console.warn('Login: userId not found in response, skipping device registration');
            }

            router.replace('/(tabs)');
        } catch {
            Alert.alert('خطأ', 'فشل تسجيل الدخول');
        } finally {
            setSubmitting(false);
        }
    };

    if (alreadyLoggedIn) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 justify-center p-6 bg-white">
                    <Text className="mb-6 text-xl text-center" style={{ fontFamily: 'Cairo-Regular' }}>
                        أنت مسجل دخول بالفعل
                    </Text>
                    <TouchableOpacity
                        className="py-4 mb-4 bg-green-700 rounded-xl"
                        onPress={() => router.replace('/(tabs)')}
                    >
                        <Text className="text-lg font-bold text-center text-white" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            الذهاب للرئيسية
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="py-4 rounded-xl border border-green-700"
                        onPress={() => router.replace('/logout')}
                    >
                        <Text className="text-lg font-bold text-center text-green-700" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            تسجيل الخروج
                        </Text>
                    </TouchableOpacity>
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView
                className="flex-1 bg-white"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
                    {/* Header */}
                    <View className="flex-row-reverse justify-end items-center mt-12 mb-12 text-right">

                        <Text
                            className="text-2xl font-bold text-right text-gray-900"
                            style={{ fontFamily: 'Cairo-Bold' }}
                        >
                            تسجيل الدخول
                        </Text>
                        <TouchableOpacity onPress={() => router.back()} className="mr-2">
                            <Ionicons name="arrow-forward" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* Email Input */}
                    <View className="mb-6">
                        <Text className="mb-2 text-base text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                            البريد الالكتروني
                            <Text className="text-red-500">*</Text>
                        </Text>
                        <TextInput
                            placeholder="احمد محمد حسن مصطفى"
                            placeholderTextColor="#D1D5DB"
                            autoCapitalize="none"
                            value={emailOrPhone}
                            onChangeText={setEmailOrPhone}
                            className="px-4 py-4 text-base text-right bg-white rounded-lg border border-gray-300"
                            style={{ fontFamily: 'Cairo-Regular' }}
                            textAlign="right"
                        />
                    </View>

                    {/* Password Input */}
                    <View className="mb-2">
                        <Text className="mb-2 text-base text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                            كلمة المرور
                            <Text className="text-red-500">*</Text>
                        </Text>
                        <View className="relative">
                            <TextInput
                                placeholder="ادخل كلمة المرور"
                                placeholderTextColor="#D1D5DB"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                                className="px-4 py-4 pr-12 text-base text-right bg-white rounded-lg border border-gray-300"
                                style={{ fontFamily: 'Cairo-Regular' }}
                                textAlign="right"
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                className="absolute top-4 right-4"
                            >
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={24}
                                    color="#9CA3AF"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Forgot Password Link */}
                    <TouchableOpacity className="mb-8">
                        <Text
                            className="text-sm text-right text-blue-600"
                            style={{ fontFamily: 'Cairo-Regular' }}
                        >
                            هل نسيت كلمة السر؟
                        </Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity
                        className={`py-4 rounded-xl mb-6 ${submitting ? 'bg-green-600 opacity-70' : 'bg-green-700'}`}
                        onPress={onSubmit}
                        disabled={submitting}
                    >
                        <Text
                            className="text-lg font-bold text-center text-white"
                            style={{ fontFamily: 'Cairo-SemiBold' }}
                        >
                            {submitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                        </Text>
                    </TouchableOpacity>

                    {/* Sign Up Link */}
                    <View className="flex-row-reverse gap-2 justify-center items-center">
                        <TouchableOpacity onPress={() => router.push('/registration')}>
                            <Text
                                className="text-base text-blue-600"
                                style={{ fontFamily: 'Cairo-Regular' }}
                            >
                                قم بالتسجيل
                            </Text>
                        </TouchableOpacity>
                        <Text
                            className="ml-2 text-base text-gray-600"
                            style={{ fontFamily: 'Cairo-Regular' }}
                        >
                            ليس لديك حساب؟
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}


