import { submitFarmerDetails } from '@/services/registration';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Platform, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface FarmerFormProps {
    registrationId: string;
}

const PACKAGING_OPTIONS = ['صندوق', 'كيس', 'قفص / صندوق خشبي'];

export function FarmerForm({ registrationId }: FarmerFormProps) {
    const router = useRouter();
    const [nationality, setNationality] = useState('');
    // kept for backward-compatibility of UI layout earlier; replaced by picker
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [birthDate, setBirthDate] = useState('');
    const [birthPlace, setBirthPlace] = useState('');
    const [province, setProvince] = useState('');
    const [district, setDistrict] = useState('');
    const [farmAddress, setFarmAddress] = useState('');
    const [locationLat, setLocationLat] = useState('');
    const [locationLng, setLocationLng] = useState('');
    const [storageAvailable, setStorageAvailable] = useState(false);
    const [coldStorageCapacityKg, setColdStorageCapacityKg] = useState('');
    const [landOwnership, setLandOwnership] = useState('');
    const [selectedPackaging, setSelectedPackaging] = useState<string[]>([]);
    const [showPackagingModal, setShowPackagingModal] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [birthDateDate, setBirthDateDate] = useState<Date | null>(null);
    const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);

    const togglePackaging = (option: string) => {
        if (selectedPackaging.includes(option)) {
            setSelectedPackaging(selectedPackaging.filter((p) => p !== option));
        } else {
            setSelectedPackaging([...selectedPackaging, option]);
        }
    };

    const onSubmit = async () => {
        if (!nationality || !birthDateDate || !province || !district) {
            Alert.alert('خطأ', 'الرجاء ملء جميع الحقول المطلوبة');
            return;
        }
        setSubmitting(true);
        try {
            const res = await submitFarmerDetails({
                registrationId,
                nationality,
                birthDate: birthDateDate,
                birthPlace,
                province,
                district,
                farmAddress,
                locationLat: parseFloat(locationLat || '0'),
                locationLng: parseFloat(locationLng || '0'),
                storageAvailable,
                coldStorageCapacityKg: parseFloat(coldStorageCapacityKg || '0'),
                landOwnership,
                packagingMethods: selectedPackaging,
            });
            if (res.success) {
                Alert.alert('تم الحفظ', 'تم حفظ بيانات المزارع بنجاح', [
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
            {/* Nationality */}
            <View className="mb-6">
                <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                    الجنسية
                    <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                    placeholder="ادخل الجنسية"
                    placeholderTextColor="#D1D5DB"
                    value={nationality}
                    onChangeText={setNationality}
                    className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                    style={{ fontFamily: 'Cairo-Regular' }}
                    textAlign="right"
                />
            </View>

            {/* Birth Date */}
            <View className="mb-6">
                <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                    تاريخ الميلاد
                    <Text className="text-red-500">*</Text>
                </Text>
                <TouchableOpacity
                    className="border border-gray-300 rounded-lg px-4 py-4 bg-white flex-row-reverse items-center justify-between"
                    onPress={() => (Platform.OS === 'android' ? DateTimePickerAndroid.open({
                        value: birthDateDate || new Date(),
                        mode: 'date',
                        maximumDate: new Date(),
                        onChange: (event, date) => {
                            if (event.type === 'set' && date) {
                                setBirthDateDate(date);
                            }
                        },
                    }) : setShowBirthDatePicker(true))}
                >
                    <Text className="text-base" style={{ fontFamily: 'Cairo-Regular' }}>
                        {birthDateDate ? birthDateDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'اختر التاريخ'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#065f46" />
                </TouchableOpacity>
                {Platform.OS === 'ios' && showBirthDatePicker && (
                    <DateTimePicker
                        key="birthDate"
                        value={birthDateDate || new Date()}
                        mode="date"
                        display="spinner"
                        onChange={(event: any, date?: Date) => {
                            if (event.type === 'set' && date) {
                                setBirthDateDate(date);
                            }
                            if (event.type === 'dismissed') setShowBirthDatePicker(false);
                        }}
                        maximumDate={new Date()}
                    />
                )}
            </View>

            {/* Birth Place */}
            <View className="mb-6">
                <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                    مكان الميلاد
                </Text>
                <TextInput
                    placeholder="ادخل مكان الميلاد"
                    placeholderTextColor="#D1D5DB"
                    value={birthPlace}
                    onChangeText={setBirthPlace}
                    className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                    style={{ fontFamily: 'Cairo-Regular' }}
                    textAlign="right"
                />
            </View>

            {/* Province */}
            <View className="mb-6">
                <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                    المحافظة
                    <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                    placeholder="ادخل المحافظة"
                    placeholderTextColor="#D1D5DB"
                    value={province}
                    onChangeText={setProvince}
                    className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                    style={{ fontFamily: 'Cairo-Regular' }}
                    textAlign="right"
                />
            </View>

            {/* District */}
            <View className="mb-6">
                <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                    المنطقة
                    <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                    placeholder="ادخل المنطقة"
                    placeholderTextColor="#D1D5DB"
                    value={district}
                    onChangeText={setDistrict}
                    className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                    style={{ fontFamily: 'Cairo-Regular' }}
                    textAlign="right"
                />
            </View>

            {/* Farm Address */}
            <View className="mb-6">
                <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                    عنوان المزرعة
                </Text>
                <TextInput
                    placeholder="ادخل عنوان المزرعة"
                    placeholderTextColor="#D1D5DB"
                    value={farmAddress}
                    onChangeText={setFarmAddress}
                    className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                    style={{ fontFamily: 'Cairo-Regular' }}
                    textAlign="right"
                    multiline
                    numberOfLines={3}
                />
            </View>

            {/* Location Picker */}
            <View className="mb-6">
                <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                    موقع المزرعة
                </Text>
                <TouchableOpacity
                    className="border border-gray-300 rounded-lg px-4 py-4 bg-white flex-row-reverse items-center justify-between"
                    onPress={() => setShowMapModal(true)}
                >
                    <View className="flex-row-reverse items-center">
                        <Ionicons name="location" size={20} color="#065f46" />
                        <Text className="mr-2 text-base" style={{ fontFamily: 'Cairo-Regular' }}>
                            {locationLat && locationLng
                                ? `${parseFloat(locationLat).toFixed(4)}, ${parseFloat(locationLng).toFixed(4)}`
                                : 'اختر الموقع على الخريطة'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            {/* Land Ownership */}
            <View className="mb-6">
                <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                    ملكية الأرض
                </Text>
                <TextInput
                    placeholder="مملوكة / مستأجرة"
                    placeholderTextColor="#D1D5DB"
                    value={landOwnership}
                    onChangeText={setLandOwnership}
                    className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                    style={{ fontFamily: 'Cairo-Regular' }}
                    textAlign="right"
                />
            </View>

            {/* Storage Available Switch */}
            <View className="mb-6 flex-row-reverse items-center justify-between px-4 py-4 border border-gray-300 rounded-lg bg-white">
                <Text className="text-base" style={{ fontFamily: 'Cairo-Regular' }}>
                    هل يتوفر تخزين بارد؟
                </Text>
                <Switch
                    value={storageAvailable}
                    onValueChange={setStorageAvailable}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={storageAvailable ? '#065f46' : '#f4f3f4'}
                />
            </View>

            {/* Cold Storage Capacity */}
            {storageAvailable && (
                <View className="mb-6">
                    <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                        سعة التخزين البارد (كغ)
                    </Text>
                    <TextInput
                        placeholder="ادخل السعة بالكيلوغرام"
                        placeholderTextColor="#D1D5DB"
                        value={coldStorageCapacityKg}
                        onChangeText={setColdStorageCapacityKg}
                        keyboardType="numeric"
                        className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                        style={{ fontFamily: 'Cairo-Regular' }}
                        textAlign="right"
                    />
                </View>
            )}

            {/* Packaging Methods */}
            <View className="mb-8">
                <Text className="text-base mb-2 text-left" style={{ fontFamily: 'Cairo-Regular' }}>
                    طرق التعبئة
                </Text>
                <TouchableOpacity
                    className="border border-gray-300 rounded-lg px-4 py-4 bg-white flex-row-reverse items-center justify-between"
                    onPress={() => setShowPackagingModal(true)}
                >
                    <Text className="text-base" style={{ fontFamily: 'Cairo-Regular' }}>
                        {selectedPackaging.length > 0 ? selectedPackaging.join(', ') : 'اختر طرق التعبئة'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            {/* Packaging Modal */}
            <Modal visible={showPackagingModal} transparent animationType="slide" onRequestClose={() => setShowPackagingModal(false)}>
                <TouchableOpacity className="flex-1 bg-black/50" activeOpacity={1} onPress={() => setShowPackagingModal(false)}>
                    <View className="flex-1 justify-end">
                        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                            <View className="bg-white rounded-t-3xl">
                                <View className="flex-row-reverse items-center justify-between p-6 border-b border-gray-200">
                                    <Text className="text-xl font-bold" style={{ fontFamily: 'Cairo-Bold' }}>
                                        اختر طرق التعبئة
                                    </Text>
                                    <TouchableOpacity onPress={() => setShowPackagingModal(false)}>
                                        <Ionicons name="close" size={28} color="#000" />
                                    </TouchableOpacity>
                                </View>
                                <View className="p-6">
                                    {PACKAGING_OPTIONS.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            className="flex-row-reverse items-center justify-between py-4 border-b border-gray-100"
                                            onPress={() => togglePackaging(option)}
                                        >
                                            <Text className="text-base" style={{ fontFamily: 'Cairo-Regular' }}>
                                                {option}
                                            </Text>
                                            {selectedPackaging.includes(option) && <Ionicons name="checkmark" size={24} color="#065f46" />}
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity
                                        className="bg-green-700 py-4 rounded-xl mt-6"
                                        onPress={() => setShowPackagingModal(false)}
                                    >
                                        <Text className="text-white text-center text-lg font-bold" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                            تأكيد
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Map Modal Placeholder */}
            <Modal visible={showMapModal} transparent animationType="slide" onRequestClose={() => setShowMapModal(false)}>
                <View className="flex-1 bg-white">
                    <View className="flex-row-reverse items-center justify-between p-6 border-b border-gray-200">
                        <Text className="text-xl font-bold" style={{ fontFamily: 'Cairo-Bold' }}>
                            اختر موقع المزرعة
                        </Text>
                        <TouchableOpacity onPress={() => setShowMapModal(false)}>
                            <Ionicons name="close" size={28} color="#000" />
                        </TouchableOpacity>
                    </View>
                    <View className="flex-1 items-center justify-center p-6">
                        <Text className="text-base text-center mb-4" style={{ fontFamily: 'Cairo-Regular' }}>
                            يمكنك إدخال الإحداثيات يدوياً حالياً
                        </Text>
                        <TextInput
                            placeholder="خط العرض (Latitude)"
                            value={locationLat}
                            onChangeText={setLocationLat}
                            keyboardType="numeric"
                            className="border border-gray-300 rounded-lg px-4 py-4 text-center text-base bg-white w-full mb-4"
                            style={{ fontFamily: 'Cairo-Regular' }}
                        />
                        <TextInput
                            placeholder="خط الطول (Longitude)"
                            value={locationLng}
                            onChangeText={setLocationLng}
                            keyboardType="numeric"
                            className="border border-gray-300 rounded-lg px-4 py-4 text-center text-base bg-white w-full mb-6"
                            style={{ fontFamily: 'Cairo-Regular' }}
                        />
                        <TouchableOpacity
                            className="bg-green-700 py-4 px-8 rounded-xl w-full"
                            onPress={() => setShowMapModal(false)}
                        >
                            <Text className="text-white text-center text-lg font-bold" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                حفظ الموقع
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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


