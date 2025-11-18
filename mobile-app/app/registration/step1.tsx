import { step1Account } from '@/services/registration';
import { getAuthToken } from '@/storage/auth-storage';
import { getRegistrationId } from '@/storage/registration-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const COUNTRIES = [
    { code: '+963', name: 'سوريا', flag: '🇸🇾', nameEn: 'Syria' },
    { code: '+962', name: 'الأردن', flag: '🇯🇴', nameEn: 'Jordan' },
    { code: '+20', name: 'مصر', flag: '🇪🇬', nameEn: 'Egypt' },
    { code: '+966', name: 'السعودية', flag: '🇸🇦', nameEn: 'Saudi Arabia' },
    { code: '+971', name: 'الإمارات', flag: '🇦🇪', nameEn: 'UAE' },
    { code: '+961', name: 'لبنان', flag: '🇱🇧', nameEn: 'Lebanon' },
    { code: '+964', name: 'العراق', flag: '🇮🇶', nameEn: 'Iraq' },
    { code: '+965', name: 'الكويت', flag: '🇰🇼', nameEn: 'Kuwait' },
    { code: '+968', name: 'عمان', flag: '🇴🇲', nameEn: 'Oman' },
    { code: '+974', name: 'قطر', flag: '🇶🇦', nameEn: 'Qatar' },
    { code: '+973', name: 'البحرين', flag: '🇧🇭', nameEn: 'Bahrain' },
    { code: '+967', name: 'اليمن', flag: '🇾🇪', nameEn: 'Yemen' },
    { code: '+970', name: 'فلسطين', flag: '🇵🇸', nameEn: 'Palestine' },
    { code: '+90', name: 'تركيا', flag: '🇹🇷', nameEn: 'Turkey' },
];

export default function Step1Screen() {
    const [registrationId, setRegistrationId] = useState<string | null>(null);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    useEffect(() => {
        getRegistrationId().then(setRegistrationId);
        getAuthToken().then((t) => setAlreadyLoggedIn(!!t));
    }, []);

    const onSubmit = async () => {
        if (!registrationId) {
            Alert.alert('خطأ', 'جلسة التسجيل مفقودة');
            return;
        }
        if (!fullName || !email || !phone || !password) {
            Alert.alert('خطأ', 'الرجاء ملء جميع الحقول المطلوبة');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('خطأ', 'كلمة المرور وتأكيد كلمة المرور غير متطابقتين');
            return;
        }
        setSubmitting(true);
        try {
            const fullPhone = selectedCountry.code + phone;
            const res = await step1Account({
                registrationId,
                fullName,
                email,
                phone: fullPhone,
                password,
            });
            if (res.success) {
                // Optionally show dev OTP for testing
                if (res.data?.devOtp) {
                    Alert.alert('تم إرسال OTP', `رمز التطوير: ${res.data.devOtp}`);
                }
                router.replace('/registration/otp');
            }
        } catch (e: any) {
            Alert.alert('خطأ', e?.message || 'فشل الإرسال');
        } finally {
            setSubmitting(false);
        }
    };

    if (alreadyLoggedIn) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 bg-white items-center justify-center p-6">
                    <Text className="text-xl mb-6 text-center" style={{ fontFamily: 'Cairo-SemiBold' }}>
                        أنت مسجل دخول بالفعل
                    </Text>
                    <TouchableOpacity
                        className="bg-green-700 py-4 px-8 rounded-xl mb-4"
                        onPress={() => router.replace('/(tabs)')}
                    >
                        <Text className="text-white text-center text-lg" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            الذهاب للرئيسية
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="border-2 border-green-700 py-4 px-8 rounded-xl"
                        onPress={() => router.replace('/logout')}
                    >
                        <Text className="text-green-700 text-center text-lg" style={{ fontFamily: 'Cairo-SemiBold' }}>
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
                <ScrollView className="flex-1 " contentContainerStyle={{ padding: 24 }}>
                    {/* Header */}
                    <View className="flex-row-reverse items-center justify-end mb-8 mt-12">
                        <Text
                            className="text-2xl font-bold text-gray-900 text-left"
                            style={{ fontFamily: 'Cairo-Bold' }}
                        >
                            تسجيل حساب جديد
                        </Text>
                        <TouchableOpacity onPress={() => router.back()} className="mr-2">
                            <Ionicons name="arrow-forward" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* Full Name Input */}
                    <View className="mb-6">
                        <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                            الاسم
                            <Text className="text-red-500">*</Text>
                        </Text>
                        <TextInput
                            placeholder="احمد محمد حسن مصطفى"
                            placeholderTextColor="#D1D5DB"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                            className="border border-gray-300 rounded-lg px-4 py-4  text-base bg-white"
                            style={{ fontFamily: 'Cairo-Regular' }}
                            textAlign="right"
                        />
                    </View>

                    {/* Email Input */}
                    <View className="mb-6">
                        <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                            البريد الالكتروني
                            <Text className="text-red-500">*</Text>
                        </Text>
                        <TextInput
                            placeholder="ادخل بريدك الالكتروني"
                            placeholderTextColor="#D1D5DB"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            className="border border-gray-300 rounded-lg px-4 py-4  text-base bg-white"
                            style={{ fontFamily: 'Cairo-Regular' }}
                            textAlign="right"
                        />
                    </View>

                    {/* Phone Input with Country Code */}
                    <View className="mb-6">
                        <Text className="text-base mb-2 text-left " style={{ fontFamily: 'Cairo-Regular' }}>
                            رقم الهاتف
                            <Text className="text-red-500">*</Text>
                        </Text>
                        <View className="flex-row-reverse border border-gray-300 rounded-lg bg-white">
                            <TextInput
                                placeholder="08 88xx xxx"
                                placeholderTextColor="#D1D5DB"
                                value={phone}
                                onChangeText={(text) => {
                                    setPhone(text.slice(0, 9));
                                }}
                                keyboardType="phone-pad"
                                className="flex-1 px-4 py-4 text-base"
                                style={{ fontFamily: 'Cairo-Regular' }}
                                textAlign="right"
                            />
                            <TouchableOpacity
                                className="border-l border-gray-300 px-4 py-4 flex-row items-center"
                                onPress={() => setShowCountryPicker(true)}
                            >
                                <Text className="text-base mr-2" style={{ fontFamily: 'Cairo-Regular' }}>
                                    {selectedCountry.code}
                                </Text>
                                <Text className="text-2xl">{selectedCountry.flag}</Text>
                                <Ionicons name="chevron-down" size={16} color="#9CA3AF" className="ml-1" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Country Picker Modal */}
                    <Modal
                        visible={showCountryPicker}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setShowCountryPicker(false)}
                    >
                        <TouchableOpacity
                            className="flex-1 bg-black/50"
                            activeOpacity={1}
                            onPress={() => setShowCountryPicker(false)}
                        >
                            <View className="flex-1 justify-end">
                                <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                                    <View className="bg-white rounded-t-3xl">
                                        {/* Modal Header */}
                                        <View className="flex-row-reverse items-center justify-between p-6 border-b border-gray-200">
                                            <Text
                                                className="text-xl font-bold"
                                                style={{ fontFamily: 'Cairo-Bold' }}
                                            >
                                                اختر رمز الدولة
                                            </Text>
                                            <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                                                <Ionicons name="close" size={28} color="#000" />
                                            </TouchableOpacity>
                                        </View>

                                        {/* Country List */}
                                        <ScrollView className="max-h-96">
                                            {COUNTRIES.map((country) => (
                                                <TouchableOpacity
                                                    key={country.code}
                                                    className="flex-row-reverse items-center justify-between px-6 py-4 border-b border-gray-100"
                                                    onPress={() => {
                                                        setSelectedCountry(country);
                                                        setShowCountryPicker(false);
                                                    }}
                                                >
                                                    <View className="flex-row-reverse items-center">
                                                        <Text className="text-2xl ml-3">{country.flag}</Text>
                                                        <Text
                                                            className="text-base"
                                                            style={{ fontFamily: 'Cairo-Regular' }}
                                                        >
                                                            {country.name}
                                                        </Text>
                                                    </View>
                                                    <Text
                                                        className="text-base text-gray-600"
                                                        style={{ fontFamily: 'Cairo-Regular' }}
                                                    >
                                                        {country.code}
                                                    </Text>
                                                    {selectedCountry.code === country.code && (
                                                        <Ionicons name="checkmark" size={24} color="#065f46" />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    {/* Password Input */}
                    <View className="mb-6">
                        <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
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
                                className="border border-gray-300 rounded-lg px-4 py-4 pr-12  text-base bg-white"
                                style={{ fontFamily: 'Cairo-Regular' }}
                                textAlign="right"
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-4"
                            >
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={24}
                                    color="#9CA3AF"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Confirm Password Input */}
                    <View className="mb-8">
                        <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                            تأكيد كلمة المرور
                            <Text className="text-red-500">*</Text>
                        </Text>
                        <View className="relative">
                            <TextInput
                                placeholder="ادخل كلمة المرور"
                                placeholderTextColor="#D1D5DB"
                                secureTextEntry={!showConfirmPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                className="border border-gray-300 rounded-lg px-4 py-4 pr-12  text-base bg-white"
                                style={{ fontFamily: 'Cairo-Regular' }}
                                textAlign="right"
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-4"
                            >
                                <Ionicons
                                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                    size={24}
                                    color="#9CA3AF"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        className={`py-4 rounded-xl mb-6 ${submitting ? 'bg-green-600 opacity-70' : 'bg-green-700'}`}
                        onPress={onSubmit}
                        disabled={submitting}
                    >
                        <Text
                            className="text-white text-center text-lg font-bold"
                            style={{ fontFamily: 'Cairo-SemiBold' }}
                        >
                            {submitting ? 'جاري الإرسال...' : 'التالي'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}


