import { BottomSheetSelect, SelectOption } from '@/components/ui/bottom-sheet-select';
import { getFarmById, updateFarm } from '@/services/farm';
import { getAuthUser } from '@/storage/auth-storage';
import type { Farm, UpdateFarmDto } from '@/types/farm';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const COUNTRIES: SelectOption[] = [
    { label: 'سوريا', value: 'SYR' },
    { label: 'الأردن', value: 'JOR' },
    { label: 'لبنان', value: 'LBN' },
];

const OWNERSHIP_TYPES: SelectOption[] = [
    { label: 'ملك', value: 'owned' },
    { label: 'إيجار', value: 'rented' },
    { label: 'شراكة', value: 'partnership' },
];

export default function EditFarmScreen() {
    const { id } = useLocalSearchParams();
    const farmId = Number(id);
    const insets = useSafeAreaInsets();

    const [userId, setUserId] = useState<number | null>(null);
    const [farm, setFarm] = useState<Farm | null>(null);
    const [name, setName] = useState<string>('');
    const [country, setCountry] = useState<string>('');
    const [governorate, setGovernorate] = useState<string>('');
    const [city, setCity] = useState<string>('');
    const [village, setVillage] = useState<string>('');
    const [street, setStreet] = useState<string>('');
    const [area, setArea] = useState<string>('');
    const [district, setDistrict] = useState<string>('');
    const [latitude, setLatitude] = useState<string>('');
    const [longitude, setLongitude] = useState<string>('');
    const [landOwnershipType, setLandOwnershipType] = useState<string>('');
    const [canStoreAfterHarvest, setCanStoreAfterHarvest] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingFarm, setLoadingFarm] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const showValidationError = (message: string) => {
        setError(message);
        Alert.alert('خطأ', message);
    };

    useEffect(() => {
        const load = async () => {
            const u = await getAuthUser<any>();
            setUserId(u?.userId || u?.id || null);

            if (farmId) {
                await loadFarm();
            }
        };
        load();
    }, [farmId]);

    const loadFarm = async () => {
        setLoadingFarm(true);
        try {
            const res = await getFarmById(farmId);
            const data = (res as any)?.data ?? res;
            setFarm(data);

            // Populate form fields
            setName(data.name || '');
            setCountry(data.country || '');
            setGovernorate(data.governorate || '');
            setCity(data.city || '');
            setVillage(data.village || '');
            setStreet(data.street || '');
            setArea(data.area || '');
            setDistrict(data.district || '');
            setLatitude(data.latitude ? String(data.latitude) : '');
            setLongitude(data.longitude ? String(data.longitude) : '');
            setLandOwnershipType(data.landOwnershipType || '');
            setCanStoreAfterHarvest(data.canStoreAfterHarvest || false);
        } catch (e: any) {
            Alert.alert('خطأ', e?.message || 'فشل في تحميل بيانات المزرعة');
        } finally {
            setLoadingFarm(false);
        }
    };

    const onSubmit = async () => {
        const hasValidFarmId = Number.isFinite(farmId) && farmId > 0;
        if (!hasValidFarmId) {
            showValidationError('تعذر تحديد المزرعة المطلوبة');
            return;
        }

        if (!userId) {
            showValidationError('المستخدم غير موجود');
            return;
        }

        const trimmedName = name.trim();
        if (!trimmedName) {
            showValidationError('يرجى إدخال اسم المزرعة');
            return;
        }

        if (!country) {
            showValidationError('يرجى اختيار الدولة');
            return;
        }

        const trimmedGovernorate = governorate.trim();
        if (!trimmedGovernorate) {
            showValidationError('يرجى إدخال المحافظة');
            return;
        }

        const trimmedCity = city.trim();
        if (!trimmedCity) {
            showValidationError('يرجى إدخال المدينة');
            return;
        }

        const trimmedVillage = village.trim();
        if (!trimmedVillage) {
            showValidationError('يرجى إدخال القرية');
            return;
        }

        const trimmedArea = area.trim();
        if (!trimmedArea) {
            showValidationError('يرجى إدخال المساحة');
            return;
        }

        if (!landOwnershipType) {
            showValidationError('يرجى اختيار نوع الملكية');
            return;
        }

        const trimmedStreet = street.trim();
        const trimmedDistrict = district.trim();
        const trimmedLatitude = latitude.trim();
        const trimmedLongitude = longitude.trim();
        const normalizedStreet = trimmedStreet || '';
        const normalizedDistrict = trimmedDistrict || '';
        const normalizedLatitude = trimmedLatitude ? Number(trimmedLatitude) : 0;
        const normalizedLongitude = trimmedLongitude ? Number(trimmedLongitude) : 0;

        if (trimmedLatitude && Number.isNaN(Number(trimmedLatitude))) {
            showValidationError('قيمة خط العرض غير صالحة');
            return;
        }
        if (trimmedLongitude && Number.isNaN(Number(trimmedLongitude))) {
            showValidationError('قيمة خط الطول غير صالحة');
            return;
        }

        const dto: UpdateFarmDto = {
            name: trimmedName,
            country,
            governorate: trimmedGovernorate,
            city: trimmedCity,
            village: trimmedVillage,
            street: normalizedStreet,
            area: trimmedArea,
            district: normalizedDistrict,
            latitude: normalizedLatitude,
            longitude: normalizedLongitude,
            landOwnershipType,
            canStoreAfterHarvest,
        };

        setLoading(true);
        setError(null);
        try {
            await updateFarm(farmId, userId, dto);
            Alert.alert('نجح', 'تم تحديث المزرعة بنجاح', [
                { text: 'حسناً', onPress: () => router.back() }
            ]);
        } catch (e: any) {
            const serverErrors = e?.response?.errors;
            if (serverErrors && typeof serverErrors === 'object') {
                const firstKey = Object.keys(serverErrors)[0];
                const firstError = firstKey ? serverErrors[firstKey] : null;
                const normalizedMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                setError(normalizedMessage || e?.message || 'فشل في تحديث المزرعة');
            } else {
                setError(e?.message || 'فشل في تحديث المزرعة');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loadingFarm) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
                    <View className="flex-1 justify-center items-center bg-white">
                        <ActivityIndicator size="large" color="#16A34A" />
                        <Text className="mt-4" style={{ fontFamily: 'Cairo-Regular' }}>
                            جاري تحميل البيانات...
                        </Text>
                    </View>
                </SafeAreaView>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
                <ScrollView
                    className="flex-1 bg-white"
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 + insets.bottom + 80 }}
                >
                    {/* Loading */}
                    {loading && (
                        <View className="flex-row items-center mb-4">
                            <ActivityIndicator color="#16A34A" />
                            <Text className="mr-2" style={{ fontFamily: 'Cairo-Regular' }}>
                                جاري الحفظ...
                            </Text>
                        </View>
                    )}

                    {/* Error */}
                    {!!error && (
                        <View className="p-3 mb-4 bg-red-50 rounded-lg border border-red-200">
                            <Text className="text-red-700" style={{ fontFamily: 'Cairo-Regular' }}>
                                {error}
                            </Text>
                        </View>
                    )}

                    {/* Farm Name */}
                    <View className="mb-3">
                        <Text className="mb-2 text-gray-700" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            اسم المزرعة *
                        </Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="مثال: مزرعة الخير"
                            placeholderTextColor="#9CA3AF"
                            className="p-3 rounded-lg border border-gray-300"
                            style={{ fontFamily: 'Cairo-Regular', textAlign: 'right' }}
                        />
                    </View>

                    {/* Country */}
                <BottomSheetSelect
                    label="الدولة"
                    placeholder="اختر الدولة"
                    value={country}
                    options={COUNTRIES}
                    onChange={setCountry}
                    required
                />

                    {/* Governorate */}
                    <View className="mb-3">
                        <Text className="mb-2 text-gray-700" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            المحافظة
                        </Text>
                        <TextInput
                            value={governorate}
                            onChangeText={setGovernorate}
                            placeholder="مثال: دمشق"
                            placeholderTextColor="#9CA3AF"
                            className="p-3 rounded-lg border border-gray-300"
                            style={{ fontFamily: 'Cairo-Regular', textAlign: 'right' }}
                        />
                    </View>

                    {/* City */}
                    <View className="mb-3">
                        <Text className="mb-2 text-gray-700" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            المدينة
                        </Text>
                        <TextInput
                            value={city}
                            onChangeText={setCity}
                            placeholder="مثال: الغوطة"
                            placeholderTextColor="#9CA3AF"
                            className="p-3 rounded-lg border border-gray-300"
                            style={{ fontFamily: 'Cairo-Regular', textAlign: 'right' }}
                        />
                    </View>

                    {/* Village */}
                    <View className="mb-3">
                        <Text className="mb-2 text-gray-700" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            القرية
                        </Text>
                        <TextInput
                            value={village}
                            onChangeText={setVillage}
                            placeholder="مثال: القرية الشرقية"
                            placeholderTextColor="#9CA3AF"
                            className="p-3 rounded-lg border border-gray-300"
                            style={{ fontFamily: 'Cairo-Regular', textAlign: 'right' }}
                        />
                    </View>

                    {/* Area */}
                    <View className="mb-3">
                        <Text className="mb-2 text-gray-700" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            المساحة
                        </Text>
                        <TextInput
                            value={area}
                            onChangeText={setArea}
                            placeholder="مثال: 10 هكتار"
                            placeholderTextColor="#9CA3AF"
                            className="p-3 rounded-lg border border-gray-300"
                            style={{ fontFamily: 'Cairo-Regular', textAlign: 'right' }}
                        />
                    </View>

                    {/* Ownership Type */}
                <BottomSheetSelect
                    label="نوع الملكية"
                    placeholder="اختر نوع الملكية"
                    value={landOwnershipType}
                    options={OWNERSHIP_TYPES}
                    onChange={setLandOwnershipType}
                    required
                />

                    {/* Can Store After Harvest */}
                    <View className="flex-row justify-between items-center p-3 mb-4 rounded-lg border border-gray-300">
                        <Text className="text-gray-700" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            إمكانية التخزين بعد الحصاد
                        </Text>
                        <Switch
                            value={canStoreAfterHarvest}
                            onValueChange={setCanStoreAfterHarvest}
                            trackColor={{ false: '#d1d5db', true: '#86efac' }}
                            thumbColor={canStoreAfterHarvest ? '#16a34a' : '#f3f4f6'}
                        />
                    </View>

                    {/* Submit Button */}
                    <Pressable
                        onPress={onSubmit}
                        disabled={loading}
                        className={`py-3 rounded-lg ${loading ? 'bg-gray-400' : 'bg-green-600'}`}
                    >
                        <Text className="text-lg text-center text-white" style={{ fontFamily: 'Cairo-Bold' }}>
                            {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                        </Text>
                    </Pressable>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}