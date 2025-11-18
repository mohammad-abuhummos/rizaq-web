import { addPayoutAccount, completeRegistrationStep5, getPayoutAccounts, setDefaultPayout, submitRegistration } from '@/services/registration';
import { getRegistrationId } from '@/storage/registration-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PAYOUT_TYPES = [
    { id: 1, label: 'حساب بنكي', labelEn: 'Bank Account' },
    { id: 2, label: 'محفظة إلكترونية', labelEn: 'E-Wallet' },
    { id: 3, label: 'نقدي', labelEn: 'Cash' },
];

export default function PayoutScreen() {
    const [registrationId, setRegistrationId] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState(PAYOUT_TYPES[0]);
    const [showTypePicker, setShowTypePicker] = useState(false);
    const [providerName, setProviderName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [iban, setIban] = useState('');
    const [isDefault, setIsDefault] = useState<boolean>(true);
    const [loading, setLoading] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [addAccount, setAddAccount] = useState(false);

    useEffect(() => {
        getRegistrationId().then(setRegistrationId);
    }, []);

    useEffect(() => {
        if (!registrationId) return;
        getPayoutAccounts(registrationId)
            .then((res: any) => {
                if (res?.success && Array.isArray(res.data)) {
                    setPayouts(res.data);
                } else if (Array.isArray(res)) {
                    setPayouts(res);
                }
            })
            .catch(() => { });
    }, [registrationId]);

    const onAdd = async () => {

        if (!registrationId) return Alert.alert('خطأ', 'جلسة التسجيل مفقودة');
        if (!providerName || !accountNumber) {
            Alert.alert('خطأ', 'الرجاء ملء اسم المزود ورقم الحساب');
            return;
        }
        setLoading(true);
        try {
            const res = await addPayoutAccount({
                registrationId,
                type: selectedType.id,
                providerName,
                accountNumber,
                iban: iban || '',
                isDefault,
            });
            if (res.success) {
                setProviderName('');
                setAccountNumber('');
                setIban('');
                const list = await getPayoutAccounts(registrationId);
                if ((list as any)?.success && Array.isArray((list as any)?.data)) setPayouts((list as any).data);
                else if (Array.isArray(list)) setPayouts(list as any);
                Alert.alert('تم الحفظ', 'تم إضافة حساب الدفع بنجاح');
            }
        } catch (e: any) {
            Alert.alert('خطأ', e?.message || 'فشل حفظ حساب الدفع');
        } finally {
            setLoading(false);
            setAddAccount(true)
        }
    };

    const onSetDefault = async (payoutId: number) => {
        if (!registrationId) return;
        try {
            await setDefaultPayout(payoutId, registrationId);
            const list = await getPayoutAccounts(registrationId);
            if ((list as any)?.success && Array.isArray((list as any)?.data)) setPayouts((list as any).data);
            else if (Array.isArray(list)) setPayouts(list as any);
        } catch { }
    };

    const onCompleteAndSubmit = async () => {
        if (!registrationId) return;
        setCompleting(true);
        try {
            await completeRegistrationStep5(registrationId);
            await submitRegistration(registrationId);
            Alert.alert('تم بنجاح', 'تم إكمال التسجيل بنجاح', [
                { text: 'موافق', onPress: () => router.replace('/login') }
            ]);
        } catch (e: any) {
            Alert.alert('خطأ', e?.message || 'فشل إكمال التسجيل');
            setCompleting(false);
        }
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
                            className="text-2xl font-bold text-gray-900 text-left"
                            style={{ fontFamily: 'Cairo-Bold' }}
                        >
                            طريقة الدفع
                        </Text>
                        <TouchableOpacity onPress={() => router.back()} className="mr-2">
                            <Ionicons name="arrow-forward" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* Payout Type Picker */}
                    <View className="mb-6">
                        <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                            نوع الحساب
                        </Text>
                        <TouchableOpacity
                            className="border border-gray-300 rounded-lg px-4 py-4 bg-white flex-row-reverse items-center justify-between"
                            onPress={() => setShowTypePicker(true)}
                        >
                            <Text className="text-base" style={{ fontFamily: 'Cairo-Regular' }}>
                                {selectedType.label}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {/* Type Picker Modal */}
                    <Modal
                        visible={showTypePicker}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setShowTypePicker(false)}
                    >
                        <TouchableOpacity
                            className="flex-1 bg-black/50"
                            activeOpacity={1}
                            onPress={() => setShowTypePicker(false)}
                        >
                            <View className="flex-1 justify-end">
                                <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                                    <View className="bg-white rounded-t-3xl">
                                        <View className="flex-row-reverse items-center justify-between p-6 border-b border-gray-200">
                                            <Text className="text-xl font-bold" style={{ fontFamily: 'Cairo-Bold' }}>
                                                اختر نوع الحساب
                                            </Text>
                                            <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                                                <Ionicons name="close" size={28} color="#000" />
                                            </TouchableOpacity>
                                        </View>
                                        <View className="p-6">
                                            {PAYOUT_TYPES.map((type) => (
                                                <TouchableOpacity
                                                    key={type.id}
                                                    className="flex-row-reverse items-center justify-between py-4 border-b border-gray-100"
                                                    onPress={() => {
                                                        setSelectedType(type);
                                                        setShowTypePicker(false);
                                                    }}
                                                >
                                                    <Text className="text-base" style={{ fontFamily: 'Cairo-Regular' }}>
                                                        {type.label}
                                                    </Text>
                                                    {selectedType.id === type.id && (
                                                        <Ionicons name="checkmark" size={24} color="#065f46" />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    {/* Provider Name */}
                    <View className="mb-6">
                        <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                            اسم المزود
                            <Text className="text-red-500">*</Text>
                        </Text>
                        <TextInput
                            placeholder="البنك أو المحفظة"
                            placeholderTextColor="#D1D5DB"
                            value={providerName}
                            onChangeText={setProviderName}
                            className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                            style={{ fontFamily: 'Cairo-Regular' }}
                            textAlign="right"
                        />
                    </View>

                    {/* Account Number */}
                    <View className="mb-6">
                        <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                            رقم الحساب
                            <Text className="text-red-500">*</Text>
                        </Text>
                        <TextInput
                            placeholder="ادخل رقم الحساب"
                            placeholderTextColor="#D1D5DB"
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                            keyboardType="numeric"
                            className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                            style={{ fontFamily: 'Cairo-Regular' }}
                            textAlign="right"
                        />
                    </View>

                    {/* IBAN */}
                    <View className="mb-6">
                        <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                            IBAN (اختياري)
                        </Text>
                        <TextInput
                            placeholder="ادخل رقم IBAN"
                            placeholderTextColor="#D1D5DB"
                            value={iban}
                            onChangeText={setIban}
                            autoCapitalize="characters"
                            className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                            style={{ fontFamily: 'Cairo-Regular' }}
                            textAlign="right"
                        />
                    </View>

                    {/* Is Default Toggle */}
                    <View className="mb-8 flex-row-reverse items-center justify-between px-4 py-4 border border-gray-300 rounded-lg bg-white">
                        <Text className="text-base" style={{ fontFamily: 'Cairo-Regular' }}>
                            حساب افتراضي
                        </Text>
                        <TouchableOpacity
                            onPress={() => setIsDefault(!isDefault)}
                            className={`w-12 h-6 rounded-full ${isDefault ? 'bg-green-700' : 'bg-gray-300'} justify-center`}
                        >
                            <View
                                className={`w-5 h-5 rounded-full bg-white ${isDefault ? 'ml-6' : 'ml-1'}`}
                                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Add Account Button */}
                    <TouchableOpacity
                        className={`py-4 rounded-xl mb-8 ${loading ? 'bg-green-600 opacity-70' : 'bg-gray-100'} border-2 border-green-700`}
                        onPress={onAdd}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#065f46" />
                        ) : (
                            <View className="flex-row-reverse items-center justify-center">
                                <Ionicons name="add-circle-outline" size={20} color="#065f46" />
                                <Text className="text-green-700 text-center text-base font-bold mr-2" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                    إضافة حساب دفع
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Existing Payout Accounts */}
                    {payouts.length > 0 && (
                        <View className="mb-8">
                            <Text className="text-lg font-bold mb-4 text-left" style={{ fontFamily: 'Cairo-Bold' }}>
                                حسابات الدفع المضافة
                            </Text>
                            {payouts.map((item: any) => (
                                <View key={item.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                                    <View className="flex-row-reverse items-start justify-between mb-2">
                                        <View className="flex-1">
                                            <Text className="text-base font-semibold text-right mb-1" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                                {item.providerName}
                                            </Text>
                                            <Text className="text-sm text-gray-600 text-right mb-1" style={{ fontFamily: 'Cairo-Regular' }}>
                                                الحساب: {item.accountNumber}
                                            </Text>
                                            {item.iban && (
                                                <Text className="text-sm text-gray-600 text-right" style={{ fontFamily: 'Cairo-Regular' }}>
                                                    IBAN: {item.iban}
                                                </Text>
                                            )}
                                        </View>
                                        {item.isDefault && (
                                            <View className="bg-green-100 px-3 py-1 rounded-full">
                                                <Text className="text-green-700 text-xs font-bold" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                                    افتراضي
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    {!item.isDefault && (
                                        <TouchableOpacity
                                            className="bg-green-50 py-2 rounded-lg mt-2"
                                            onPress={() => onSetDefault(item.id)}
                                        >
                                            <Text className="text-green-700 text-center text-sm font-bold" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                                تعيين كافتراضي
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Complete Registration Button */}
                    <TouchableOpacity
                        className={`py-4 rounded-xl ${completing ? 'bg-green-600 opacity-70' : 'bg-green-700'}`}
                        onPress={addAccount ? onCompleteAndSubmit : () => Alert.alert('تنبيه', 'الرجاء إضافة حساب دفع واحد على الأقل قبل إكمال التسجيل')}
                        disabled={completing}
                    >
                        {completing ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text className="text-white text-center text-lg font-bold" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                إكمال التسجيل
                            </Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}


