import { startRegistration, verifyOtp } from '@/services/registration';
import { clearRegistrationId, getRegistrationId, saveRegistrationId } from '@/storage/registration-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function OtpScreen() {
    const [registrationId, setRegistrationId] = useState<string | null>(null);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [submitting, setSubmitting] = useState(false);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        getRegistrationId().then(setRegistrationId);
    }, []);

    const handleOtpChange = (value: string, index: number) => {
        if (!/^\d*$/.test(value)) return; // Only allow digits

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const onSubmit = async () => {
        const otpString = otp.join('');
        if (!registrationId) {
            Alert.alert('خطأ', 'جلسة التسجيل مفقودة');
            return;
        }
        if (otpString.length !== 6) {
            Alert.alert('خطأ', 'الرجاء إدخال رمز التحقق المكون من 6 أرقام');
            return;
        }
        setSubmitting(true);
        try {
            const res = await verifyOtp({ registrationId, otp: otpString });
            if (res.success && res.data?.verified) {
                router.replace('/registration/role');
                return;
            }
        } catch (e: any) {
            const detail: string | undefined = e?.detail || e?.response?.error?.detail;
            const code: string | undefined = e?.code || e?.response?.error?.code;
            const isExpired = (code === 'invalid_operation' || e?.status === 400) && typeof detail === 'string' && /session expired/i.test(detail);
            if (isExpired) {
                // silently restart and send user back to step1 to re-enter account details
                await clearRegistrationId();
                const start = await startRegistration();
                await saveRegistrationId(start.data.registrationId);
                router.replace('/registration/step1');
                return;
            }
            Alert.alert('خطأ', e?.message || 'فشل التحقق من رمز OTP');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResend = () => {
        Alert.alert('تم', 'تم إعادة إرسال رمز التحقق');
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView
                className="flex-1 bg-white"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
                    {/* Header */}
                    <View className="flex-row-reverse items-center justify-end mb-8 mt-12">
                        <Text
                            className="text-2xl font-bold text-gray-900 text-right"
                            style={{ fontFamily: 'Cairo-Bold' }}
                        >
                            التحقق من OTP
                        </Text>
                        <TouchableOpacity onPress={() => router.back()} className="mr-2">
                            <Ionicons name="arrow-forward" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* OTP Input Label */}
                    <Text
                        className="text-lg font-semibold text-center mb-4 text-green-700"
                        style={{ fontFamily: 'Cairo-SemiBold' }}
                    >
                        ادخل رمز التحقق OTP
                    </Text>

                    {/* OTP Description */}
                    <Text
                        className="text-base text-center mb-8 text-gray-600"
                        style={{ fontFamily: 'Cairo-Regular' }}
                    >
                        تم إرسال رمز OTP مكون من 4 أرقام لرقم هاتفك
                    </Text>

                    {/* OTP Input Boxes */}
                    <View className="flex-row-reverse justify-center mb-6 gap-2">
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => {
                                    inputRefs.current[index] = ref;
                                }}
                                value={digit}
                                onChangeText={(value) => handleOtpChange(value, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                className="w-12 h-14 border-2 border-gray-300 rounded-lg text-center text-xl bg-white"
                                style={{ fontFamily: 'Cairo-Bold' }}
                                selectTextOnFocus
                            />
                        ))}
                    </View>

                    {/* Resend Link */}
                    <View className="flex-row-reverse justify-center items-center mb-8 gap-2">
                        <TouchableOpacity onPress={handleResend}>
                            <Text
                                className="text-blue-600"
                                style={{ fontFamily: 'Cairo-Regular' }}
                            >
                                أعد إرساله
                            </Text>
                        </TouchableOpacity>
                        <Text className="text-gray-400" style={{ fontFamily: 'Cairo-Regular' }}>لم تتسلم رمز التحقق، </Text>


                    </View>

                    {/* Action Buttons */}
                    <View className="gap-4">
                        <TouchableOpacity
                            className={`py-4 rounded-xl ${submitting ? 'bg-green-600 opacity-70' : 'bg-green-700'}`}
                            onPress={onSubmit}
                            disabled={submitting}
                        >
                            <Text
                                className="text-white text-center text-lg font-bold"
                                style={{ fontFamily: 'Cairo-SemiBold' }}
                            >
                                {submitting ? 'جاري التحقق...' : 'تأكيد'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="border-2 border-gray-300 py-4 rounded-xl"
                            onPress={() => router.back()}
                        >
                            <Text
                                className="text-gray-700 text-center text-lg font-bold"
                                style={{ fontFamily: 'Cairo-SemiBold' }}
                            >
                                العودة
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}


