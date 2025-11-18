import { submitTraderDetails } from '@/services/registration';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface TraderFormProps {
    registrationId: string;
}

export function TraderForm({ registrationId }: TraderFormProps) {
    const router = useRouter();
    const [companyName, setCompanyName] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [activity, setActivity] = useState('');
    const [taxNumber, setTaxNumber] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [canBuy, setCanBuy] = useState(true);
    const [canImport, setCanImport] = useState(true);
    const [canExport, setCanExport] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async () => {
        if (!companyName || !companyEmail || !companyPhone) {
            Alert.alert('خطأ', 'الرجاء ملء جميع الحقول المطلوبة');
            return;
        }
        setSubmitting(true);
        try {
            const res = await submitTraderDetails({
                registrationId,
                companyName,
                companyEmail,
                companyPhone,
                activity,
                taxNumber,
                licenseNumber,
                canBuy,
                canImport,
                canExport,
            });
            if (res.success) {
                Alert.alert('تم الحفظ', 'تم حفظ بيانات التاجر بنجاح', [
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
            {/* Company Name */}
            <View className="mb-6">
                <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                    اسم الشركة
                    <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                    placeholder="ادخل اسم الشركة"
                    placeholderTextColor="#D1D5DB"
                    value={companyName}
                    onChangeText={setCompanyName}
                    className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                    style={{ fontFamily: 'Cairo-Regular' }}
                    textAlign="right"
                />
            </View>

            {/* Company Email */}
            <View className="mb-6">
                <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                    البريد الإلكتروني للشركة
                    <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                    placeholder="email@company.com"
                    placeholderTextColor="#D1D5DB"
                    value={companyEmail}
                    onChangeText={setCompanyEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                    style={{ fontFamily: 'Cairo-Regular' }}
                    textAlign="right"
                />
            </View>

            {/* Company Phone */}
            <View className="mb-6">
                <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                    هاتف الشركة
                    <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                    placeholder="ادخل رقم هاتف الشركة"
                    placeholderTextColor="#D1D5DB"
                    value={companyPhone}
                    onChangeText={setCompanyPhone}
                    keyboardType="phone-pad"
                    className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                    style={{ fontFamily: 'Cairo-Regular' }}
                    textAlign="right"
                />
            </View>

            {/* Activity */}
            <View className="mb-6">
                <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                    النشاط التجاري
                </Text>
                <TextInput
                    placeholder="ادخل نوع النشاط التجاري"
                    placeholderTextColor="#D1D5DB"
                    value={activity}
                    onChangeText={setActivity}
                    className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                    style={{ fontFamily: 'Cairo-Regular' }}
                    textAlign="right"
                />
            </View>

            {/* Tax Number */}
            <View className="mb-6">
                <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                    الرقم الضريبي
                </Text>
                <TextInput
                    placeholder="ادخل الرقم الضريبي"
                    placeholderTextColor="#D1D5DB"
                    value={taxNumber}
                    onChangeText={setTaxNumber}
                    className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                    style={{ fontFamily: 'Cairo-Regular' }}
                    textAlign="right"
                />
            </View>

            {/* License Number */}
            <View className="mb-6">
                <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                    رقم الترخيص
                </Text>
                <TextInput
                    placeholder="ادخل رقم الترخيص"
                    placeholderTextColor="#D1D5DB"
                    value={licenseNumber}
                    onChangeText={setLicenseNumber}
                    className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                    style={{ fontFamily: 'Cairo-Regular' }}
                    textAlign="right"
                />
            </View>

            {/* Can Buy Switch */}
            {/* <View className="mb-6 flex-row-reverse items-center justify-between px-4 py-4 border border-gray-300 rounded-lg bg-white">
                <View className="flex-row-reverse items-center">
                    <Ionicons name="cart" size={20} color="#065f46" />
                    <Text className="text-base mr-2" style={{ fontFamily: 'Cairo-Regular' }}>
                        يمكنه الشراء
                    </Text>
                </View>
                <Switch
                    value={canBuy}
                    onValueChange={setCanBuy}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={canBuy ? '#065f46' : '#f4f3f4'}
                />
            </View> */}

            {/* Can Import Switch */}
            {/* <View className="mb-6 flex-row-reverse items-center justify-between px-4 py-4 border border-gray-300 rounded-lg bg-white">
                <View className="flex-row-reverse items-center">
                    <Ionicons name="download" size={20} color="#065f46" />
                    <Text className="text-base mr-2" style={{ fontFamily: 'Cairo-Regular' }}>
                        يمكنه الاستيراد
                    </Text>
                </View>
                <Switch
                    value={canImport}
                    onValueChange={setCanImport}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={canImport ? '#065f46' : '#f4f3f4'}
                />
            </View> */}

            {/* Can Export Switch */}
            {/* <View className="mb-8 flex-row-reverse items-center justify-between px-4 py-4 border border-gray-300 rounded-lg bg-white">
                <View className="flex-row-reverse items-center">
                    <Ionicons name="cloud-upload-outline" size={20} color="#065f46" />
                    <Text className="text-base mr-2" style={{ fontFamily: 'Cairo-Regular' }}>
                        يمكنه التصدير
                    </Text>
                </View>
                <Switch
                    value={canExport}
                    onValueChange={setCanExport}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={canExport ? '#065f46' : '#f4f3f4'}
                />
            </View> */}

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


