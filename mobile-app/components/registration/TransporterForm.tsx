import { submitTransporterDetails } from '@/services/registration';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface TransporterFormProps {
    registrationId: string;
}

export function TransporterForm({ registrationId }: TransporterFormProps) {
    const router = useRouter();
    const [accountType, setAccountType] = useState('');
    const [fleetCapacity, setFleetCapacity] = useState('');
    const [coverageAreaText, setCoverageAreaText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async () => {
        if (!accountType || !fleetCapacity) {
            Alert.alert('خطأ', 'الرجاء ملء جميع الحقول المطلوبة');
            return;
        }
        setSubmitting(true);
        try {
            const res = await submitTransporterDetails({
                registrationId,
                accountType,
                fleetCapacity: parseInt(fleetCapacity || '0', 10),
                coverageAreaText,
            });
            if (res.success) {
                Alert.alert('تم الحفظ', 'تم حفظ بيانات الناقل بنجاح', [
                    { text: 'متابعة للمستندات', onPress: () => router.replace('/registration/documents') },
                ]);
            }
        } catch (e: any) {
            Alert.alert('خطأ', e?.message || 'فشل حفظ البيانات');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View>
            {/* Account Type */}
            <View className="mb-6">
                <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                    نوع الحساب
                    <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                    placeholder="شخصي / شركة"
                    placeholderTextColor="#D1D5DB"
                    value={accountType}
                    onChangeText={setAccountType}
                    className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                    style={{ fontFamily: 'Cairo-Regular' }}
                    textAlign="right"
                />
            </View>

            {/* Fleet Capacity */}
            <View className="mb-6">
                <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                    سعة الأسطول
                    <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                    placeholder="عدد المركبات"
                    placeholderTextColor="#D1D5DB"
                    value={fleetCapacity}
                    onChangeText={setFleetCapacity}
                    keyboardType="numeric"
                    className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                    style={{ fontFamily: 'Cairo-Regular' }}
                    textAlign="right"
                />
            </View>

            {/* Coverage Area */}
            <View className="mb-8">
                <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                    منطقة التغطية
                </Text>
                <TextInput
                    placeholder="المناطق التي يمكنك الوصول إليها"
                    placeholderTextColor="#D1D5DB"
                    value={coverageAreaText}
                    onChangeText={setCoverageAreaText}
                    className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                    style={{ fontFamily: 'Cairo-Regular' }}
                    textAlign="right"
                    multiline
                    numberOfLines={3}
                />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
                className={`py-4 rounded-xl mb-4 ${submitting ? 'bg-green-600 opacity-70' : 'bg-green-700'}`}
                onPress={onSubmit}
                disabled={submitting}
            >
                <Text className="text-white text-center text-lg font-bold" style={{ fontFamily: 'Cairo-SemiBold' }}>
                    {submitting ? 'جاري الحفظ...' : 'حفظ ومتابعة'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}


