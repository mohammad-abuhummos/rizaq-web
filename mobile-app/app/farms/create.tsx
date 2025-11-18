import { BottomSheetSelect, SelectOption } from '@/components/ui/bottom-sheet-select';
import { createFarm } from '@/services/farm';
import { getAuthUser } from '@/storage/auth-storage';
import type { CreateFarmDto } from '@/types/farm';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, LayoutChangeEvent, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

type FieldKey = 'name' | 'country' | 'governorate' | 'city' | 'village' | 'area' | 'landOwnershipType';

export default function CreateFarmScreen() {
    const insets = useSafeAreaInsets();
    const [userId, setUserId] = useState<number | null>(null);
    const [name, setName] = useState<string>('');
    const [country, setCountry] = useState<string>('');
    const [governorate, setGovernorate] = useState<string>('');
    const [city, setCity] = useState<string>('');
    const [village, setVillage] = useState<string>('');
    const [street] = useState<string>('');
    const [area, setArea] = useState<string>('');
    const [district] = useState<string>('');
    const [latitude] = useState<string>('');
    const [longitude] = useState<string>('');
    const [landOwnershipType, setLandOwnershipType] = useState<string>('');
    const [canStoreAfterHarvest, setCanStoreAfterHarvest] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});

    const scrollViewRef = useRef<ScrollView | null>(null);
    const fieldLayouts = useRef<Partial<Record<FieldKey, number>>>({});

    const fieldOrder: FieldKey[] = ['name', 'country', 'governorate', 'city', 'village', 'area', 'landOwnershipType'];

    const clearFieldError = (field: FieldKey) => {
        setFieldErrors((prev) => {
            if (!prev || !prev[field]) {
                return prev;
            }

            const { [field]: _removed, ...rest } = prev;
            return rest;
        });
    };

    const handleFieldLayout = (field: FieldKey) => (event: LayoutChangeEvent) => {
        fieldLayouts.current[field] = event.nativeEvent.layout.y;
    };

    const scrollToField = (field: FieldKey) => {
        const position = fieldLayouts.current[field];
        if (typeof position === 'number' && scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: Math.max(position - 24, 0), animated: true });
        }
    };

    const validateFields = () => {
        const requiredMessage = 'هذا الحقل مطلوب';
        const newErrors: Partial<Record<FieldKey, string>> = {};

        if (!name.trim()) newErrors.name = requiredMessage;
        if (!country) newErrors.country = requiredMessage;
        if (!governorate.trim()) newErrors.governorate = requiredMessage;
        if (!city.trim()) newErrors.city = requiredMessage;
        if (!village.trim()) newErrors.village = requiredMessage;
        if (!area.trim()) newErrors.area = requiredMessage;
        if (!landOwnershipType) newErrors.landOwnershipType = requiredMessage;

        setFieldErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            const firstField = fieldOrder.find((field) => newErrors[field]);
            if (firstField) {
                scrollToField(firstField);
            }
            return false;
        }

        return true;
    };

    useEffect(() => {
        const load = async () => {
            const u = await getAuthUser<any>();
            setUserId(u?.userId || u?.id || null);
        };
        load();
    }, []);

    const onSubmit = async () => {
        if (!userId) {
            Alert.alert('خطأ', 'المستخدم غير موجود');
            return;
        }

        const isValid = validateFields();
        if (!isValid) {
            return;
        }

        const dto: CreateFarmDto = {
            name: name.trim(),
            country: country || "",
            governorate: governorate.trim() || "",
            city: city.trim() || "",
            village: village.trim() || "",
            street: street.trim() || "",
            area: area.trim() || "",
            district: district.trim() || "",
            latitude: latitude ? Number(latitude) : 0,
            longitude: longitude ? Number(longitude) : 0,
            landOwnershipType: landOwnershipType || "",
            canStoreAfterHarvest,
        };

        setLoading(true);
        setError(null);
        try {
            await createFarm(userId, dto);
            Alert.alert('نجح', 'تم إنشاء المزرعة بنجاح', [
                { text: 'حسناً', onPress: () => router.back() }
            ]);
        } catch (e: any) {
            setError(e?.message || 'فشل في إنشاء المزرعة');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top', 'bottom']}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
                >
                    <View className="flex-1 bg-gray-50">
                        {/* Modern Gradient Header */}
                        <LinearGradient
                            colors={['#10b981', '#059669', '#047857']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.headerGradient}
                        >
                            <View style={styles.headerContent}>
                                <View className="flex-row items-center justify-between mb-4">
                                    <TouchableOpacity
                                        onPress={() => router.back()}
                                        style={styles.backButton}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="arrow-forward" size={24} color="#ffffff" />
                                    </TouchableOpacity>

                                    <View style={styles.iconContainer}>
                                        <Ionicons name="leaf" size={28} color="#ffffff" />
                                    </View>
                                </View>

                                <View>
                                    <Text style={[styles.headerTitle, { fontFamily: 'Cairo-Bold' }]}>
                                        إضافة مزرعة جديدة
                                    </Text>
                                    <Text style={[styles.headerSubtitle, { fontFamily: 'Cairo-Regular' }]}>
                                        املأ البيانات لإضافة مزرعة إلى حسابك
                                    </Text>
                                </View>
                            </View>
                        </LinearGradient>

                        <ScrollView
                            ref={scrollViewRef}
                            className="flex-1"
                            contentContainerStyle={{ padding: 16, paddingBottom: 32 + insets.bottom + 80 }}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                            onScrollBeginDrag={Keyboard.dismiss}
                        >
                            {/* Loading */}
                            {loading && (
                                <View className="flex-row items-center mb-4 p-3 bg-green-50 rounded-lg">
                                    <ActivityIndicator color="#16A34A" />
                                    <Text className="mr-2 text-green-700" style={{ fontFamily: 'Cairo-Regular' }}>
                                        جاري الإرسال...
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
                        <View
                            className="mb-4 bg-white p-4 rounded-xl"
                            style={styles.card}
                            onLayout={handleFieldLayout('name')}
                        >
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="create-outline" size={20} color="#059669" />
                                <Text className="mr-2 text-gray-700" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                    اسم المزرعة *
                                </Text>
                            </View>
                            <TextInput
                                value={name}
                                onChangeText={(value) => {
                                    setName(value);
                                    clearFieldError('name');
                                }}
                                placeholder="مثال: مزرعة الخير"
                                placeholderTextColor="#9CA3AF"
                                className="p-3 rounded-lg bg-gray-50"
                                style={[
                                    { fontFamily: 'Cairo-Regular', textAlign: 'right', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
                                    fieldErrors.name && { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
                                ]}
                            />
                            {!!fieldErrors.name && (
                                <Text style={styles.errorText}>
                                    {fieldErrors.name}
                                </Text>
                            )}
                        </View>

                        {/* Country */}
                        <View onLayout={handleFieldLayout('country')}>
                            <BottomSheetSelect
                                label="الدولة"
                                placeholder="اختر الدولة"
                                value={country}
                                options={COUNTRIES}
                                onChange={(value) => {
                                    setCountry(value);
                                    clearFieldError('country');
                                }}
                                required
                                error={fieldErrors.country}
                            />
                        </View>

                        {/* Location Card */}
                        <View
                            className="mb-4 bg-white p-4 rounded-xl"
                            style={styles.card}
                            onLayout={handleFieldLayout('governorate')}
                        >
                            <View className="flex-row items-center mb-3">
                                <Ionicons name="location-outline" size={20} color="#059669" />
                                <Text className="mr-2 text-gray-700" style={{ fontFamily: 'Cairo-SemiBold', fontSize: 16 }}>
                                    معلومات الموقع
                                </Text>
                            </View>

                            <View className="mb-3">
                                <Text className="mb-2 text-gray-600 text-sm" style={{ fontFamily: 'Cairo-Regular' }}>
                                    المحافظة
                                </Text>
                                <TextInput
                                    value={governorate}
                                    onChangeText={(value) => {
                                        setGovernorate(value);
                                        clearFieldError('governorate');
                                    }}
                                    placeholder="مثال: دمشق"
                                    placeholderTextColor="#9CA3AF"
                                    className="p-3 rounded-lg bg-gray-50"
                                    style={[
                                        { fontFamily: 'Cairo-Regular', textAlign: 'right', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
                                        fieldErrors.governorate && { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
                                    ]}
                                />
                                {!!fieldErrors.governorate && (
                                    <Text style={styles.errorText}>
                                        {fieldErrors.governorate}
                                    </Text>
                                )}
                            </View>

                            <View className="mb-3">
                                <Text className="mb-2 text-gray-600 text-sm" style={{ fontFamily: 'Cairo-Regular' }}>
                                    المدينة
                                </Text>
                                <TextInput
                                    value={city}
                                    onChangeText={(value) => {
                                        setCity(value);
                                        clearFieldError('city');
                                    }}
                                    placeholder="مثال: الغوطة"
                                    placeholderTextColor="#9CA3AF"
                                    className="p-3 rounded-lg bg-gray-50"
                                    style={[
                                        { fontFamily: 'Cairo-Regular', textAlign: 'right', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
                                        fieldErrors.city && { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
                                    ]}
                                />
                                {!!fieldErrors.city && (
                                    <Text style={styles.errorText}>
                                        {fieldErrors.city}
                                    </Text>
                                )}
                            </View>

                            <View className="mb-0">
                                <Text className="mb-2 text-gray-600 text-sm" style={{ fontFamily: 'Cairo-Regular' }}>
                                    القرية
                                </Text>
                                <TextInput
                                    value={village}
                                    onChangeText={(value) => {
                                        setVillage(value);
                                        clearFieldError('village');
                                    }}
                                    placeholder="مثال: القرية الشرقية"
                                    placeholderTextColor="#9CA3AF"
                                    className="p-3 rounded-lg bg-gray-50"
                                    style={[
                                        { fontFamily: 'Cairo-Regular', textAlign: 'right', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
                                        fieldErrors.village && { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
                                    ]}
                                />
                                {!!fieldErrors.village && (
                                    <Text style={styles.errorText}>
                                        {fieldErrors.village}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Area & Ownership Card */}
                        <View
                            className="mb-4 bg-white p-4 rounded-xl"
                            style={styles.card}
                            onLayout={handleFieldLayout('area')}
                        >
                            <View className="flex-row items-center mb-3">
                                <Ionicons name="resize-outline" size={20} color="#059669" />
                                <Text className="mr-2 text-gray-700" style={{ fontFamily: 'Cairo-SemiBold', fontSize: 16 }}>
                                    تفاصيل المزرعة
                                </Text>
                            </View>

                            <View className="mb-3">
                                <Text className="mb-2 text-gray-600 text-sm" style={{ fontFamily: 'Cairo-Regular' }}>
                                    المساحة
                                </Text>
                                <TextInput
                                    value={area}
                                    onChangeText={(value) => {
                                        setArea(value);
                                        clearFieldError('area');
                                    }}
                                    placeholder="مثال: 10 هكتار"
                                    placeholderTextColor="#9CA3AF"
                                    className="p-3 rounded-lg bg-gray-50"
                                    style={[
                                        { fontFamily: 'Cairo-Regular', textAlign: 'right', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
                                        fieldErrors.area && { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
                                    ]}
                                />
                                {!!fieldErrors.area && (
                                    <Text style={styles.errorText}>
                                        {fieldErrors.area}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Ownership Type */}
                        <View onLayout={handleFieldLayout('landOwnershipType')}>
                            <BottomSheetSelect
                                label="نوع الملكية"
                                placeholder="اختر نوع الملكية"
                                value={landOwnershipType}
                                options={OWNERSHIP_TYPES}
                                onChange={(value) => {
                                    setLandOwnershipType(value);
                                    clearFieldError('landOwnershipType');
                                }}
                                required
                                error={fieldErrors.landOwnershipType}
                            />
                        </View>

                        {/* Can Store After Harvest */}
                        <View className="mb-4 bg-white p-4 rounded-xl" style={styles.card}>
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center flex-1">
                                    <Ionicons name="cube-outline" size={20} color="#059669" />
                                    <Text className="mr-2 text-gray-700" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                        إمكانية التخزين بعد الحصاد
                                    </Text>
                                </View>
                                <Switch
                                    value={canStoreAfterHarvest}
                                    onValueChange={setCanStoreAfterHarvest}
                                    trackColor={{ false: '#d1d5db', true: '#86efac' }}
                                    thumbColor={canStoreAfterHarvest ? '#10b981' : '#f3f4f6'}
                                />
                            </View>
                        </View>

                        {/* Submit Button */}
                            <TouchableOpacity
                                onPress={onSubmit}
                                disabled={loading}
                                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                                activeOpacity={0.8}
                            >
                            <LinearGradient
                                colors={loading ? ['#9ca3af', '#9ca3af'] : ['#10b981', '#059669']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.buttonGradient}
                            >
                                {loading ? (
                                    <View className="flex-row items-center">
                                        <ActivityIndicator color="#ffffff" size="small" />
                                        <Text className="mr-2 text-lg text-white" style={{ fontFamily: 'Cairo-Bold' }}>
                                            جاري الإنشاء...
                                        </Text>
                                    </View>
                                ) : (
                                    <View className="flex-row items-center">
                                        <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                                        <Text className="mr-2 text-lg text-white" style={{ fontFamily: 'Cairo-Bold' }}>
                                            إضافة المزرعة
                                        </Text>
                                    </View>
                                )}
                            </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    headerGradient: {
        paddingTop: 50,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    headerContent: {
        marginTop: 8,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 28,
        color: '#ffffff',
        marginBottom: 6,
        textAlign: 'right',
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'right',
    },
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    submitButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    submitButtonDisabled: {
        shadowOpacity: 0.1,
    },
    buttonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        marginTop: 6,
        fontSize: 13,
        color: '#dc2626',
        fontFamily: 'Cairo-Regular',
        textAlign: 'right',
    },
});
