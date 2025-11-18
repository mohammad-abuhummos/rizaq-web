import { getCropsByFarm } from '@/services/crop';
import { createDirectListing } from '@/services/direct';
import { listFarmsByUser } from '@/services/farm';
import { getAuthUser } from '@/storage/auth-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { BottomSheetSelect, SelectOption } from '@/components/ui/bottom-sheet-select';

const UNITS: SelectOption[] = [
    { label: 'كيلوغرام (كجم)', value: 'kg' },
    { label: 'طن', value: 'ton' },
    { label: 'صندوق', value: 'box' },
    { label: 'كيس', value: 'bag' },
    { label: 'قطعة', value: 'piece' },
    { label: 'حزمة', value: 'bundle' },
    { label: 'ليتر', value: 'liter' },
];

export default function NewDirectListingScreen() {
    const { createdFarmId } = useLocalSearchParams<{ createdFarmId?: string }>();
    const [sellerUserId, setSellerUserId] = useState<number | null>(null);
    const [title, setTitle] = useState<string>('');
    // Crop selection
    const [farms, setFarms] = useState<any[]>([]);
    const [selectedFarm, setSelectedFarm] = useState<any | null>(null);
    const [crops, setCrops] = useState<any[]>([]);
    const [selectedCrop, setSelectedCrop] = useState<any | null>(null);
    const [unit, setUnit] = useState<string>('');
    const [unitPrice, setUnitPrice] = useState<string>('');
    const [availableQty, setAvailableQty] = useState<string>('');
    const [minOrderQty, setMinOrderQty] = useState<string>('');
    const [maxOrderQty, setMaxOrderQty] = useState<string>('');
    const [location, setLocation] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false); // submitting
    const [loadingData, setLoadingData] = useState<boolean>(true); // initial farms load
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            const u = await getAuthUser<any>();
            setSellerUserId(u?.userId || u?.id || null);
        };
        load();
    }, []);

    // Load farms for the user
    useEffect(() => {
        const run = async () => {
            if (!sellerUserId) return;
            setLoadingData(true);
            try {
                const res = await listFarmsByUser(sellerUserId);
                const data = (res as any)?.data ?? res;
                if (Array.isArray(data)) setFarms(data);
            } catch (e: any) {
                setError(e?.message || 'فشل في تحميل المزارع');
            } finally {
                setLoadingData(false);
            }
        };
        run();
    }, [sellerUserId]);

    // Load crops when farm changes
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (!selectedFarm?.farmLandId && !selectedFarm?.id && !selectedFarm?.farmId) {
                if (!cancelled) setCrops([]);
                return;
            }
            const farmId = selectedFarm?.farmLandId || selectedFarm?.id || selectedFarm?.farmId;
            try {
                const res = await getCropsByFarm(Number(farmId));
                const data = (res as any)?.data ?? res;
                if (!cancelled && Array.isArray(data)) setCrops(data);
            } catch (e: any) {
                if (!cancelled) setError(e?.message || 'فشل في تحميل المحاصيل');
            }
        };
        load();
        return () => { cancelled = true; };
    }, [selectedFarm]);

    // Auto-select farm if we returned from create crop with createdFarmId
    const appliedParamSelectRef = useRef(false);
    useEffect(() => {
        if (appliedParamSelectRef.current) return;
        if (!createdFarmId) return;
        if (!farms.length) return;
        const f = farms.find((x: any) => {
            const fid = x?.farmLandId || x?.id || x?.farmId;
            return String(fid) === String(createdFarmId);
        });
        if (f) {
            setSelectedFarm(f);
            appliedParamSelectRef.current = true;
        }
    }, [farms, createdFarmId]);

    const onSubmit = async () => {
        if (!sellerUserId) {
            Alert.alert('خطأ', 'المستخدم غير موجود');
            return;
        }
        if (!selectedCrop) {
            Alert.alert('خطأ', 'يرجى اختيار المحصول');
            return;
        }
        const price = Number(unitPrice);
        const avail = Number(availableQty);
        const min = Number(minOrderQty);
        const max = maxOrderQty ? Number(maxOrderQty) : undefined;
        if (!unit) {
            Alert.alert('خطأ', 'يرجى إدخال الوحدة');
            return;
        }
        if (!price || price <= 0) {
            Alert.alert('خطأ', 'يرجى إدخال سعر صحيح');
            return;
        }
        if (!avail || avail <= 0) {
            Alert.alert('خطأ', 'يرجى إدخال كمية متاحة صحيحة');
            return;
        }
        if (!min || min <= 0) {
            Alert.alert('خطأ', 'يرجى إدخال الحد الأدنى للطلب');
            return;
        }
        if (max !== undefined && max <= 0) {
            Alert.alert('خطأ', 'الحد الأقصى يجب أن يكون أكبر من 0');
            return;
        }
        if (max !== undefined && min > max) {
            Alert.alert('خطأ', 'الحد الأدنى لا يمكن أن يتجاوز الحد الأقصى');
            return;
        }

        const dto: any = {
            sellerUserId,
            title: title || undefined,
            cropId: Number(selectedCrop?.cropId || selectedCrop?.id),
            cropName: (selectedCrop?.name || selectedCrop?.product?.nameAr || selectedCrop?.product?.nameEn || undefined),
            unit,
            unitPrice: price,
            availableQty: avail,
            minOrderQty: min,
            maxOrderQty: max,
            location: location || undefined,
        };

        setLoading(true);
        setError(null);
        try {
            await createDirectListing(dto);
            Alert.alert('نجح', 'تم إنشاء القائمة بنجاح', [
                { text: 'حسناً', onPress: () => router.back() }
            ]);
        } catch (e: any) {
            const detail = e?.detail || e?.response?.error?.detail || e?.response?.detail || e?.message;
            setError(detail || 'فشل في إنشاء القائمة');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={{ flex: 1, backgroundColor: 'white' }}>
                {/* Modern Header */}
                <View style={{
                    paddingHorizontal: 16,
                    paddingTop: 48,
                    paddingBottom: 16,
                    backgroundColor: '#16A34A',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    elevation: 3,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Pressable onPress={() => router.back()} style={{ padding: 8, marginRight: 12 }}>
                            <Ionicons name="arrow-forward" size={24} color="white" />
                        </Pressable>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 24, color: 'white', fontFamily: 'Cairo-Bold', textAlign: 'right' }}>
                                إنشاء قائمة بيع مباشرة
                            </Text>
                            <Text style={{ fontSize: 14, color: '#dcfce7', marginTop: 4, fontFamily: 'Cairo-Regular', textAlign: 'right' }}>
                                اختر محصولك واملأ التفاصيل
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Content */}
                <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
                    {/* Loading */}
                    {loading && (
                        <View className="flex-row items-center mb-4">
                            <ActivityIndicator color="#16A34A" />
                            <Text className="mr-2" style={{ fontFamily: 'Cairo-Regular' }}>
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

                    {/* Loading farms */}
                    {loadingData && (
                        <View className="flex-row items-center mb-4">
                            <ActivityIndicator color="#16A34A" />
                            <Text className="mr-2" style={{ fontFamily: 'Cairo-Regular' }}>
                                جاري تحميل المزارع...
                            </Text>
                        </View>
                    )}

                    {/* No Farms Screen */}
                    {!loadingData && farms.length === 0 && (
                        <View style={{ padding: 16 }}>
                            <View style={{ padding: 16, marginBottom: 16, backgroundColor: '#fefce8', borderRadius: 12, borderWidth: 1, borderColor: '#fde047' }}>
                                <Text style={{ marginBottom: 8, fontSize: 18, textAlign: 'center', color: '#1f2937', fontFamily: 'Cairo-Bold' }}>
                                    لا توجد مزارع متاحة
                                </Text>
                                <Text style={{ fontSize: 14, textAlign: 'center', color: '#4b5563', fontFamily: 'Cairo-Regular' }}>
                                    تحتاج إلى إنشاء مزرعة قبل اختيار المحصول.
                                </Text>
                            </View>
                            <Pressable onPress={() => router.push('/farms/create' as any)} className="py-3 bg-green-600 rounded-lg">
                                <Text className="text-center text-white" style={{ fontFamily: 'Cairo-Bold' }}>إنشاء مزرعة</Text>
                            </Pressable>
                        </View>
                    )}

                    {/* Farm Selection */}
                    {!loadingData && farms.length > 0 && (
                        <View className="mb-4">
                            <Text className="mb-2 text-gray-700" style={{ fontFamily: 'Cairo-SemiBold', textAlign: 'right' }}>
                                اختر المزرعة *
                            </Text>
                            <View>
                                {farms.map((f: any) => {
                                    const fid = f?.farmLandId || f?.id || f?.farmId;
                                    const name = f?.name || `مزرعة #${fid}`;
                                    const selected = (selectedFarm?.farmLandId || selectedFarm?.id || selectedFarm?.farmId) === fid;
                                    return (
                                        <Pressable
                                            key={String(fid)}
                                            onPress={() => { setSelectedFarm(f); setSelectedCrop(null); }}
                                            style={{
                                                padding: 12,
                                                borderRadius: 12,
                                                borderWidth: 2,
                                                marginBottom: 8,
                                                backgroundColor: selected ? '#f0fdf4' : 'white',
                                                borderColor: selected ? '#16A34A' : '#d1d5db'
                                            }}
                                        >
                                            <Text style={{ color: selected ? '#14532d' : '#374151', fontFamily: selected ? 'Cairo-Bold' : 'Cairo-Regular', textAlign: 'right' }}>
                                                {name}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Crops for selected farm */}
                    {selectedFarm && (
                        <View className="mb-4">
                            <Text className="mb-2 text-gray-700" style={{ fontFamily: 'Cairo-SemiBold', textAlign: 'right' }}>
                                اختر المحصول *
                            </Text>
                            <View>
                                {crops.map((c: any) => {
                                    const cid = c?.cropId || c?.id;
                                    const name = c?.name || c?.product?.nameAr || c?.product?.nameEn || `محصول #${cid}`;
                                    const selected = (selectedCrop?.cropId || selectedCrop?.id) === cid;
                                    return (
                                        <Pressable
                                            key={String(cid)}
                                            onPress={() => setSelectedCrop(c)}
                                            style={{
                                                padding: 12,
                                                borderRadius: 12,
                                                borderWidth: 2,
                                                marginBottom: 8,
                                                backgroundColor: selected ? '#eff6ff' : 'white',
                                                borderColor: selected ? '#2563eb' : '#d1d5db'
                                            }}
                                        >
                                            <Text style={{ color: selected ? '#1e3a8a' : '#374151', fontFamily: selected ? 'Cairo-Bold' : 'Cairo-Regular', textAlign: 'right' }}>
                                                {name}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                            {/* Always-available create crop CTA */}
                            <Pressable
                                onPress={() => {
                                    const fid = selectedFarm?.farmLandId || selectedFarm?.id || selectedFarm?.farmId;
                                    const returnTo = `/direct/new?createdFarmId=${encodeURIComponent(String(fid))}`;
                                    router.push(`/crops/create?farmLandId=${encodeURIComponent(String(fid))}&returnTo=${encodeURIComponent(returnTo)}` as any);
                                }}
                                style={{
                                    paddingVertical: 12,
                                    marginTop: 8,
                                    borderRadius: 12,
                                    borderWidth: 2,
                                    borderColor: '#d1d5db',
                                    borderStyle: 'dashed'
                                }}
                            >
                                <Text style={{ textAlign: 'center', color: '#4b5563', fontFamily: 'Cairo-SemiBold' }}>
                                    + إنشاء محصول جديد
                                </Text>
                            </Pressable>
                            {crops.length === 0 && (
                                <View style={{ paddingTop: 8 }}>
                                    <Text style={{ fontFamily: 'Cairo-Regular', textAlign: 'right', color: '#6b7280', marginBottom: 8 }}>لا توجد محاصيل لهذه المزرعة.</Text>
                                    <Pressable onPress={() => {
                                        const fid = selectedFarm?.farmLandId || selectedFarm?.id || selectedFarm?.farmId;
                                        const returnTo = `/direct/new?createdFarmId=${encodeURIComponent(String(fid))}`;
                                        router.push(`/crops/create?farmLandId=${encodeURIComponent(String(fid))}&returnTo=${encodeURIComponent(returnTo)}` as any);
                                    }} className="py-3 bg-green-600 rounded-lg">
                                        <Text className="text-center text-white" style={{ fontFamily: 'Cairo-Bold' }}>إنشاء محصول</Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Title */}
                    <View className="mb-3">
                        <Text className="mb-2 text-gray-700" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            العنوان
                        </Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="مثال: طماطم طازجة"
                            placeholderTextColor="#9CA3AF"
                            className="p-3 rounded-lg border border-gray-300"
                            style={{ fontFamily: 'Cairo-Regular', textAlign: 'right' }}
                        />
                    </View>

                    {/* Crop Name - auto from selection (display only) */}
                    {selectedCrop && (
                        <View className="mb-3">
                            <Text className="mb-2 text-gray-700" style={{ fontFamily: 'Cairo-SemiBold', textAlign: 'right' }}>
                                المحصول المحدد
                            </Text>
                            <View className="p-3 bg-gray-50 rounded-lg border border-gray-300">
                                <Text style={{ fontFamily: 'Cairo-Regular', textAlign: 'right', color: '#374151' }}>
                                    {selectedCrop?.name || selectedCrop?.product?.nameAr || selectedCrop?.product?.nameEn}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Unit Dropdown */}
                    <BottomSheetSelect
                        label="الوحدة"
                        placeholder="اختر الوحدة"
                        value={unit}
                        options={UNITS}
                        onChange={setUnit}
                        required
                    />

                    {/* Unit Price */}
                    <View className="mb-3">
                        <Text className="mb-2 text-gray-700" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            السعر للوحدة *
                        </Text>
                        <TextInput
                            value={unitPrice}
                            onChangeText={setUnitPrice}
                            placeholder="مثال: 15"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            className="p-3 rounded-lg border border-gray-300"
                            style={{ fontFamily: 'Cairo-Regular', textAlign: 'right' }}
                        />
                    </View>

                    {/* Available Quantity */}
                    <View className="mb-3">
                        <Text className="mb-2 text-gray-700" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            الكمية المتاحة *
                        </Text>
                        <TextInput
                            value={availableQty}
                            onChangeText={setAvailableQty}
                            placeholder="مثال: 100"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            className="p-3 rounded-lg border border-gray-300"
                            style={{ fontFamily: 'Cairo-Regular', textAlign: 'right' }}
                        />
                    </View>

                    {/* Min Order Quantity */}
                    <View className="mb-3">
                        <Text className="mb-2 text-gray-700" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            الحد الأدنى للطلب *
                        </Text>
                        <TextInput
                            value={minOrderQty}
                            onChangeText={setMinOrderQty}
                            placeholder="مثال: 10"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            className="p-3 rounded-lg border border-gray-300"
                            style={{ fontFamily: 'Cairo-Regular', textAlign: 'right' }}
                        />
                    </View>

                    {/* Max Order Quantity */}
                    <View className="mb-3">
                        <Text className="mb-2 text-gray-700" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            الحد الأقصى للطلب (اختياري)
                        </Text>
                        <TextInput
                            value={maxOrderQty}
                            onChangeText={setMaxOrderQty}
                            placeholder="مثال: 50"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            className="p-3 rounded-lg border border-gray-300"
                            style={{ fontFamily: 'Cairo-Regular', textAlign: 'right' }}
                        />
                    </View>

                    {/* Location */}
                    <View className="mb-4">
                        <Text className="mb-2 text-gray-700" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            الموقع (اختياري)
                        </Text>
                        <TextInput
                            value={location}
                            onChangeText={setLocation}
                            placeholder="مثال: دمشق"
                            placeholderTextColor="#9CA3AF"
                            className="p-3 rounded-lg border border-gray-300"
                            style={{ fontFamily: 'Cairo-Regular', textAlign: 'right' }}
                        />
                    </View>

                    {/* Submit Button */}
                    <Pressable
                        onPress={onSubmit}
                        disabled={loading}
                        className={`py-3 rounded-lg ${loading ? 'bg-gray-400' : 'bg-green-600'}`}
                    >
                        <Text className="text-lg text-center text-white" style={{ fontFamily: 'Cairo-Bold' }}>
                            {loading ? 'جاري الإنشاء...' : 'إنشاء القائمة'}
                        </Text>
                    </Pressable>
                </ScrollView>
            </View>
        </>
    );
}


