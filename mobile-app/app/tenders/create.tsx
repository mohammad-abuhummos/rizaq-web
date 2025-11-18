import { getCropsByFarm } from '@/services/crop';
import { listFarmsByUser } from '@/services/farm';
import type { Product } from '@/services/product';
import { listProducts } from '@/services/product';
import { createTender } from '@/services/tender';
import { getAuthUser } from '@/storage/auth-storage';
import type { CreateTenderDto } from '@/types/tender';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

export default function CreateTenderScreen() {
    const { createdFarmId } = useLocalSearchParams<{ createdFarmId?: string }>();
    const [form, setForm] = useState<CreateTenderDto>({
        title: '',
        description: '',
        productId: 0,
        cropName: '',
        quantity: 0,
        unit: '',
        maxBudget: undefined,
        deliveryFrom: new Date().toISOString(),
        deliveryTo: new Date(Date.now() + 86400000).toISOString(),
        deliveryLocation: '',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [userId, setUserId] = useState<number | null>(null);
    const [farms, setFarms] = useState<any[]>([]);
    const [selectedFarm, setSelectedFarm] = useState<any | null>(null);
    const [crops, setCrops] = useState<any[]>([]);
    const [selectedCrop, setSelectedCrop] = useState<any | null>(null);

    type DatePickerField = 'deliveryFrom' | 'deliveryTo' | 'startTime' | 'endTime' | null;
    const [showDatePicker, setShowDatePicker] = useState<DatePickerField>(null);
    const [deliveryFromDate, setDeliveryFromDate] = useState<Date>(new Date());
    const [deliveryToDate, setDeliveryToDate] = useState<Date>(new Date(Date.now() + 86400000));
    const [startTimeDate, setStartTimeDate] = useState<Date>(new Date());
    const [endTimeDate, setEndTimeDate] = useState<Date>(new Date(Date.now() + 86400000));

    useEffect(() => {
        (async () => {
            try {
                setLoadingProducts(true);
                const res = await listProducts();
                const list = (res as any)?.data || (res as any) || [];
                setProducts(Array.isArray(list) ? list : []);
            } catch (e: any) {
                setError(e?.message || 'فشل في تحميل المنتجات');
            } finally {
                setLoadingProducts(false);
            }
        })();
    }, []);

    useEffect(() => {
        getAuthUser().then((u: any) => {
            const id = u?.userId || u?.id;
            setUserId(typeof id === 'number' ? id : parseInt(id, 10));
        });
    }, []);

    useEffect(() => {
        const loadFarms = async () => {
            if (!userId) return;
            try {
                const res = await listFarmsByUser(userId);
                const data = (res as any)?.data ?? res;
                if (Array.isArray(data)) setFarms(data);
            } catch (e: any) {
                setError(e?.message || 'فشل في تحميل المزارع');
            }
        };
        loadFarms();
    }, [userId]);

    useEffect(() => {
        let cancelled = false;
        const loadCrops = async () => {
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
        loadCrops();
        return () => { cancelled = true; };
    }, [selectedFarm]);

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

    const onChange = (key: keyof CreateTenderDto, value: string) => {
        setForm((f) => ({ ...f, [key]: value }));
    };

    const onNumber = (key: keyof CreateTenderDto, value: string) => {
        const num = Number(value);
        setForm((f) => ({ ...f, [key]: (isNaN(num) ? 0 : num) as any }));
    };

    const handleDateChange = (field: Exclude<DatePickerField, null>, event: any, selectedDate?: Date) => {
        if (event.type === 'set' && selectedDate) {
            if (field === 'deliveryFrom') setDeliveryFromDate(selectedDate);
            else if (field === 'deliveryTo') setDeliveryToDate(selectedDate);
            else if (field === 'startTime') setStartTimeDate(selectedDate);
            else if (field === 'endTime') setEndTimeDate(selectedDate);
        }
        if (Platform.OS === 'ios' && event.type === 'dismissed') {
            setShowDatePicker(null);
        }
    };

    const openAndroidDateTimePicker = (field: Exclude<DatePickerField, null>) => {
        const currentValue = field === 'deliveryFrom' ? deliveryFromDate
            : field === 'deliveryTo' ? deliveryToDate
                : field === 'startTime' ? startTimeDate
                    : endTimeDate;
        DateTimePickerAndroid.open({
            value: currentValue,
            mode: 'date',
            onChange: (event, selectedDate) => {
                if (event.type !== 'set' || !selectedDate) return;
                const datePart = selectedDate;
                DateTimePickerAndroid.open({
                    value: currentValue,
                    mode: 'time',
                    is24Hour: true,
                    onChange: (event2, selectedTime) => {
                        if (event2.type !== 'set' || !selectedTime) return;
                        const merged = new Date(datePart);
                        merged.setHours(selectedTime.getHours());
                        merged.setMinutes(selectedTime.getMinutes());
                        merged.setSeconds(0);
                        merged.setMilliseconds(0);
                        if (field === 'deliveryFrom') setDeliveryFromDate(merged);
                        else if (field === 'deliveryTo') setDeliveryToDate(merged);
                        else if (field === 'startTime') setStartTimeDate(merged);
                        else setEndTimeDate(merged);
                    },
                });
            },
        });
    };

    const formatDateTime = (date: Date) => {
        return date.toLocaleString('ar-EG', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const submit = async () => {
        if (!form.productId || !form.quantity) {
            Alert.alert('حقول مطلوبة', 'المنتج والكمية مطلوبة');
            return;
        }
        if (!selectedCrop) {
            Alert.alert('حقول مطلوبة', 'يرجى اختيار المحصول');
            return;
        }
        if (deliveryToDate <= deliveryFromDate) {
            Alert.alert('وقت غير صالح', 'يجب أن يكون تاريخ التسليم إلى بعد تاريخ التسليم من');
            return;
        }
        if (endTimeDate <= startTimeDate) {
            Alert.alert('وقت غير صالح', 'يجب أن يكون وقت نهاية المناقصة بعد وقت البداية');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const auth = await getAuthUser<{ userId?: number }>();
            const createdBy = auth?.userId;
            const cropName = (selectedCrop?.name || selectedCrop?.product?.nameAr || selectedCrop?.product?.nameEn || '');
            const payload: any = {
                ...form,
                cropName,
                deliveryFrom: deliveryFromDate.toISOString(),
                deliveryTo: deliveryToDate.toISOString(),
                startTime: startTimeDate.toISOString(),
                endTime: endTimeDate.toISOString(),
            };
            // Optionally send cropId for backends that accept it
            payload.cropId = Number(selectedCrop?.cropId || selectedCrop?.id);
            const res = await createTender(createdBy, payload);
            const tender = (res as any)?.data ?? res;
            Alert.alert('نجح', 'تم إنشاء المناقصة');
            const id = (tender as any)?.tenderId || (tender as any)?.id;
            if (id) router.replace({ pathname: '/tenders/[id]', params: { id: String(id) } });
            else router.back();
        } catch (e: any) {
            const detail = e?.detail || e?.response?.error?.detail || e?.response?.detail || e?.message;
            setError(detail || 'فشل في إنشاء المناقصة');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={{ flex: 1, backgroundColor: 'white' }}>
                {/* Header */}
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
                                إنشاء مناقصة جديدة
                            </Text>
                            <Text style={{ fontSize: 14, color: '#dcfce7', marginTop: 4, fontFamily: 'Cairo-Regular', textAlign: 'right' }}>
                                اختر المنتج والمحصول وأكمل التفاصيل
                            </Text>
                        </View>
                    </View>
                </View>

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
                    {/* Error */}
                    {!!error && (
                        <View style={{ padding: 12, marginBottom: 12, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12 }}>
                            <Text style={{ color: '#b91c1c', fontFamily: 'Cairo-Regular', textAlign: 'right' }}>{error}</Text>
                        </View>
                    )}

                    {/* Step 1: Product */}
                    <View style={{ marginBottom: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ justifyContent: 'center', alignItems: 'center', marginLeft: 8, width: 32, height: 32, backgroundColor: '#16A34A', borderRadius: 16 }}>
                                <Text style={{ color: 'white', fontFamily: 'Cairo-Bold' }}>١</Text>
                            </View>
                            <Text style={{ fontSize: 18, color: '#1f2937', fontFamily: 'Cairo-SemiBold', textAlign: 'right' }}>
                                اختر المنتج *
                            </Text>
                        </View>
                        {loadingProducts ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <ActivityIndicator color="#16A34A" />
                                <Text style={{ marginRight: 8, fontFamily: 'Cairo-Regular', color: '#4b5563' }}>جاري التحميل...</Text>
                            </View>
                        ) : (
                            <View style={{ gap: 8 }}>
                                {products.map((p) => {
                                    const selected = p.productId === form.productId;
                                    const name = p.nameAr || p.nameEn || `#${p.productId}`;
                                    return (
                                        <Pressable
                                            key={String(p.productId)}
                                            onPress={() => setForm((f) => ({ ...f, productId: p.productId }))}
                                            style={{
                                                padding: 12,
                                                borderRadius: 12,
                                                borderWidth: 2,
                                                backgroundColor: selected ? '#f0fdf4' : 'white',
                                                borderColor: selected ? '#16A34A' : '#d1d5db'
                                            }}
                                        >
                                            <Text style={{ color: selected ? '#14532d' : '#374151', fontFamily: selected ? 'Cairo-Bold' : 'Cairo-Regular', textAlign: 'right' }}>{name}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    {/* Step 2: Farm & Crop */}
                    <View style={{ marginBottom: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ justifyContent: 'center', alignItems: 'center', marginLeft: 8, width: 32, height: 32, backgroundColor: '#2563eb', borderRadius: 16 }}>
                                <Text style={{ color: 'white', fontFamily: 'Cairo-Bold' }}>٢</Text>
                            </View>
                            <Text style={{ fontSize: 18, color: '#1f2937', fontFamily: 'Cairo-SemiBold', textAlign: 'right' }}>
                                اختر المزرعة والمحصول *
                            </Text>
                        </View>

                        {/* Farms */}
                        <View style={{ gap: 8, marginBottom: 8 }}>
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
                                            backgroundColor: selected ? '#f0fdf4' : 'white',
                                            borderColor: selected ? '#16A34A' : '#d1d5db'
                                        }}
                                    >
                                        <Text style={{ color: selected ? '#14532d' : '#374151', fontFamily: selected ? 'Cairo-Bold' : 'Cairo-Regular', textAlign: 'right' }}>{name}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* Crops */}
                        {!!selectedFarm && (
                            <View style={{ gap: 8 }}>
                                {crops.map((c: any) => {
                                    const cid = c?.cropId || c?.id;
                                    const name = c?.name || c?.product?.nameAr || c?.product?.nameEn || `محصول #${cid}`;
                                    const selected = (selectedCrop?.cropId || selectedCrop?.id) === cid;
                                    return (
                                        <Pressable
                                            key={String(cid)}
                                            onPress={() => { setSelectedCrop(c); setForm((f) => ({ ...f, cropName: (c?.name || c?.product?.nameAr || c?.product?.nameEn || '') })); }}
                                            style={{
                                                padding: 12,
                                                borderRadius: 12,
                                                borderWidth: 2,
                                                backgroundColor: selected ? '#eff6ff' : 'white',
                                                borderColor: selected ? '#2563eb' : '#d1d5db'
                                            }}
                                        >
                                            <Text style={{ color: selected ? '#1e3a8a' : '#374151', fontFamily: selected ? 'Cairo-Bold' : 'Cairo-Regular', textAlign: 'right' }}>{name}</Text>
                                        </Pressable>
                                    );
                                })}

                                {/* Create Crop CTA */}
                                <Pressable
                                    onPress={() => {
                                        const fid = selectedFarm?.farmLandId || selectedFarm?.id || selectedFarm?.farmId;
                                        const returnTo = `/tenders/create?createdFarmId=${encodeURIComponent(String(fid))}`;
                                        router.push(`/crops/create?farmLandId=${encodeURIComponent(String(fid))}&returnTo=${encodeURIComponent(returnTo)}` as any);
                                    }}
                                    style={{ paddingVertical: 12, marginTop: 4, borderRadius: 12, borderWidth: 2, borderColor: '#d1d5db', borderStyle: 'dashed' }}
                                >
                                    <Text style={{ textAlign: 'center', color: '#4b5563', fontFamily: 'Cairo-SemiBold' }}>+ إنشاء محصول جديد</Text>
                                </Pressable>

                                {crops.length === 0 && (
                                    <View style={{ paddingTop: 8 }}>
                                        <Text style={{ fontFamily: 'Cairo-Regular', textAlign: 'right', color: '#6b7280', marginBottom: 8 }}>لا توجد محاصيل لهذه المزرعة.</Text>
                                        <Pressable onPress={() => {
                                            const fid = selectedFarm?.farmLandId || selectedFarm?.id || selectedFarm?.farmId;
                                            const returnTo = `/tenders/create?createdFarmId=${encodeURIComponent(String(fid))}`;
                                            router.push(`/crops/create?farmLandId=${encodeURIComponent(String(fid))}&returnTo=${encodeURIComponent(returnTo)}` as any);
                                        }} style={{ paddingVertical: 12, borderRadius: 12, backgroundColor: '#16A34A' }}>
                                            <Text style={{ textAlign: 'center', color: 'white', fontFamily: 'Cairo-Bold' }}>إنشاء محصول</Text>
                                        </Pressable>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Step 3: Details */}
                    <View style={{ marginBottom: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ justifyContent: 'center', alignItems: 'center', marginLeft: 8, width: 32, height: 32, backgroundColor: '#ea580c', borderRadius: 16 }}>
                                <Text style={{ color: 'white', fontFamily: 'Cairo-Bold' }}>٣</Text>
                            </View>
                            <Text style={{ fontSize: 18, color: '#1f2937', fontFamily: 'Cairo-SemiBold', textAlign: 'right' }}>
                                تفاصيل المناقصة
                            </Text>
                        </View>

                        <View style={{ gap: 10 }}>
                            <LabeledInput label="العنوان" value={form.title || ''} onChangeText={(v) => onChange('title', v)} />
                            <LabeledInput label="الوصف" value={form.description || ''} onChangeText={(v) => onChange('description', v)} multiline />
                            {!!selectedCrop && (
                                <View>
                                    <Text style={{ marginBottom: 6, fontWeight: '600', textAlign: 'right' }}>المحصول المحدد</Text>
                                    <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f9fafb' }}>
                                        <Text style={{ textAlign: 'right' }}>{selectedCrop?.name || selectedCrop?.product?.nameAr || selectedCrop?.product?.nameEn}</Text>
                                    </View>
                                </View>
                            )}
                            <LabeledInput label="الكمية" value={String(form.quantity || 0)} keyboardType="numeric" onChangeText={(v) => onNumber('quantity', v)} />
                            <LabeledInput label="الوحدة" value={form.unit || ''} onChangeText={(v) => onChange('unit', v)} />
                            <LabeledInput label="الميزانية القصوى" value={form.maxBudget != null ? String(form.maxBudget) : ''} keyboardType="numeric" onChangeText={(v) => onNumber('maxBudget', v)} />
                            <LabeledInput label="موقع التسليم" value={form.deliveryLocation || ''} onChangeText={(v) => onChange('deliveryLocation', v)} />

                            {/* Delivery From */}
                            <View>
                                <Text style={{ marginBottom: 6, fontWeight: '600', textAlign: 'right' }}>التسليم من *</Text>
                                <Pressable
                                    onPress={() => (Platform.OS === 'android' ? openAndroidDateTimePicker('deliveryFrom') : setShowDatePicker('deliveryFrom'))}
                                    style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                                >
                                    <Text style={{ color: '#16A34A', fontFamily: 'Cairo-SemiBold' }}>تغيير</Text>
                                    <Text style={{ color: '#1f2937', fontFamily: 'Cairo-Regular' }}>{formatDateTime(deliveryFromDate)}</Text>
                                </Pressable>
                            </View>

                            {/* Delivery To */}
                            <View>
                                <Text style={{ marginBottom: 6, fontWeight: '600', textAlign: 'right' }}>التسليم إلى *</Text>
                                <Pressable
                                    onPress={() => (Platform.OS === 'android' ? openAndroidDateTimePicker('deliveryTo') : setShowDatePicker('deliveryTo'))}
                                    style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                                >
                                    <Text style={{ color: '#16A34A', fontFamily: 'Cairo-SemiBold' }}>تغيير</Text>
                                    <Text style={{ color: '#1f2937', fontFamily: 'Cairo-Regular' }}>{formatDateTime(deliveryToDate)}</Text>
                                </Pressable>
                            </View>

                            {/* Start Time */}
                            <View>
                                <Text style={{ marginBottom: 6, fontWeight: '600', textAlign: 'right' }}>بدء المناقصة *</Text>
                                <Pressable
                                    onPress={() => (Platform.OS === 'android' ? openAndroidDateTimePicker('startTime') : setShowDatePicker('startTime'))}
                                    style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                                >
                                    <Text style={{ color: '#16A34A', fontFamily: 'Cairo-SemiBold' }}>تغيير</Text>
                                    <Text style={{ color: '#1f2937', fontFamily: 'Cairo-Regular' }}>{formatDateTime(startTimeDate)}</Text>
                                </Pressable>
                            </View>

                            {/* End Time */}
                            <View>
                                <Text style={{ marginBottom: 6, fontWeight: '600', textAlign: 'right' }}>نهاية المناقصة *</Text>
                                <Pressable
                                    onPress={() => (Platform.OS === 'android' ? openAndroidDateTimePicker('endTime') : setShowDatePicker('endTime'))}
                                    style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                                >
                                    <Text style={{ color: '#16A34A', fontFamily: 'Cairo-SemiBold' }}>تغيير</Text>
                                    <Text style={{ color: '#1f2937', fontFamily: 'Cairo-Regular' }}>{formatDateTime(endTimeDate)}</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    <Pressable disabled={submitting} onPress={submit} style={{ marginTop: 8, backgroundColor: submitting ? '#9CA3AF' : '#16A34A', paddingVertical: 14, borderRadius: 12, alignItems: 'center', elevation: 3 }}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>{submitting ? 'جاري الإرسال…' : 'إنشاء المناقصة'}</Text>
                    </Pressable>
                </ScrollView>

                {/* Date/Time Pickers (iOS inline only) */}
                {Platform.OS === 'ios' && showDatePicker === 'deliveryFrom' && (
                    <DateTimePicker
                        key="deliveryFrom"
                        value={deliveryFromDate}
                        mode="datetime"
                        display="spinner"
                        onChange={(event: any, date?: Date) => handleDateChange('deliveryFrom', event, date)}
                        minimumDate={new Date()}
                    />
                )}
                {Platform.OS === 'ios' && showDatePicker === 'deliveryTo' && (
                    <DateTimePicker
                        key="deliveryTo"
                        value={deliveryToDate}
                        mode="datetime"
                        display="spinner"
                        onChange={(event: any, date?: Date) => handleDateChange('deliveryTo', event, date)}
                        minimumDate={new Date()}
                    />
                )}
                {Platform.OS === 'ios' && showDatePicker === 'startTime' && (
                    <DateTimePicker
                        key="startTime"
                        value={startTimeDate}
                        mode="datetime"
                        display="spinner"
                        onChange={(event: any, date?: Date) => handleDateChange('startTime', event, date)}
                        minimumDate={new Date()}
                    />
                )}
                {Platform.OS === 'ios' && showDatePicker === 'endTime' && (
                    <DateTimePicker
                        key="endTime"
                        value={endTimeDate}
                        mode="datetime"
                        display="spinner"
                        onChange={(event: any, date?: Date) => handleDateChange('endTime', event, date)}
                        minimumDate={new Date()}
                    />
                )}

                {/* Bottom Toast Error */}
                {!!error && (
                    <View
                        style={{
                            position: 'absolute', left: 16, right: 16, bottom: 24,
                            backgroundColor: '#fef2f2', borderRadius: 12, borderWidth: 1, borderColor: '#fecaca',
                            paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center',
                            shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
                        }}
                    >
                        <Text style={{ flex: 1, color: '#b91c1c', textAlign: 'right' }}>{error}</Text>
                        <Pressable onPress={() => setError(null)} style={{ padding: 8, marginLeft: 8 }}>
                            <Ionicons name="close" size={20} color="#b91c1c" />
                        </Pressable>
                    </View>
                )}
            </View>
        </>
    );
}

function LabeledInput({ label, multiline, ...props }: { label: string; value: string; onChangeText: (v: string) => void; keyboardType?: any; multiline?: boolean }) {
    return (
        <View>
            <Text style={{ marginBottom: 6, fontWeight: '600' }}>{label}</Text>
            <TextInput
                {...props}
                multiline={multiline}
                style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: multiline ? 10 : 8, backgroundColor: '#fff' }}
                placeholder={label}
            />
        </View>
    );
}

//


