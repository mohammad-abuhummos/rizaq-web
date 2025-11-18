import { getAuctionById, listAuctionsCreatedByUser, updateAuction } from '@/services/auction';
import { getMyProfile } from '@/services/auth';
import type { AuctionDetail, UpdateAuctionDto } from '@/types/auction';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

export default function EditAuctionScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const auctionId = Number(id);

    const [auction, setAuction] = useState<AuctionDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [canEdit, setCanEdit] = useState<boolean>(false);

    // Form fields
    const [title, setTitle] = useState<string>('');
    const [desc, setDesc] = useState<string>('');
    const [startingPrice, setStartingPrice] = useState<string>('');
    const [minIncrement, setMinIncrement] = useState<string>('');
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');

    const load = useCallback(async () => {
        if (!auctionId) {
            setError('رقم المزاد غير صالح');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const [profile, details] = await Promise.all([
                getMyProfile(),
                getAuctionById(auctionId),
            ]);

            const meId = (profile as any)?.userId;
            // Verify ownership (best-effort)
            try {
                const mine = await listAuctionsCreatedByUser(Number(meId));
                const mines = ((mine as any)?.data ?? mine) as any[];
                setCanEdit(mines.some((x: any) => Number(x?.auctionId) === auctionId));
            } catch {
                setCanEdit(true); // fallback to allow edit if unreachable
            }

            const a = (details as any)?.data ?? details;
            setAuction(a as AuctionDetail);
            setTitle((a as any)?.auctionTitle || '');
            setDesc((a as any)?.auctionDescription || '');
            setStartingPrice(String((a as any)?.startingPrice ?? ''));
            setMinIncrement(String((a as any)?.minIncrement ?? ''));
            setStartTime((a as any)?.startTime || '');
            setEndTime((a as any)?.endTime || '');
        } catch (e: any) {
            setError(e?.message || 'فشل تحميل بيانات المزاد');
        } finally {
            setLoading(false);
        }
    }, [auctionId]);

    useEffect(() => { load(); }, [load]);

    const onSave = useCallback(async () => {
        if (!auctionId || !canEdit) return;
        if (saving) return;
        setSaving(true);
        try {
            const payload: UpdateAuctionDto = {
                auctionId,
                auctionTitle: title?.trim() || undefined,
                auctionDescription: desc?.trim() || undefined,
                startingPrice: startingPrice ? Number(startingPrice) : undefined,
                minIncrement: minIncrement ? Number(minIncrement) : undefined,
                startTime: startTime || undefined,
                endTime: endTime || undefined,
                cropName: undefined,
            } as any;
            await updateAuction(auctionId, payload);
            Alert.alert('تم الحفظ', 'تم تحديث المزاد بنجاح');
            router.replace(`/auctions/${auctionId}` as any);
        } catch (e: any) {
            Alert.alert('خطأ', e?.message || 'فشل حفظ التعديلات');
        } finally {
            setSaving(false);
        }
    }, [auctionId, canEdit, desc, endTime, minIncrement, saving, startTime, startingPrice, title]);

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="arrow-forward" size={22} color="#1F2937" />
                </Pressable>
                <Text style={{ flex: 1, marginRight: 12, textAlign: 'center', fontWeight: '800', fontSize: 18 }}>تعديل المزاد</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#059669" />
                    <Text style={{ marginTop: 8, color: '#6B7280' }}>جاري التحميل...</Text>
                </View>
            ) : error || !auction ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
                    <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                    <Text style={{ marginTop: 12, fontWeight: '800', fontSize: 18 }}>{error || 'حدث خطأ'}</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    {!canEdit && (
                        <View style={{ backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1, padding: 12, borderRadius: 12, marginBottom: 12 }}>
                            <Text style={{ color: '#92400E' }}>لا تملك الصلاحية لتعديل هذا المزاد.</Text>
                        </View>
                    )}

                    <FormField label="عنوان المزاد" value={title} onChangeText={setTitle} placeholder="أدخل عنوان المزاد" />
                    <FormField label="الوصف" value={desc} onChangeText={setDesc} placeholder="أدخل وصفاً مختصراً" multiline />

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <FormField label="السعر الابتدائي" value={startingPrice} onChangeText={setStartingPrice} keyboardType="numeric" placeholder="0" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <FormField label="الحد الأدنى للزيادة" value={minIncrement} onChangeText={setMinIncrement} keyboardType="numeric" placeholder="0" />
                        </View>
                    </View>

                    <FormField label="تاريخ البداية (ISO)" value={startTime} onChangeText={setStartTime} placeholder="2025-11-03T22:26:11.828" />
                    <FormField label="تاريخ الإغلاق (ISO)" value={endTime} onChangeText={setEndTime} placeholder="2027-11-03T22:26:11.828" />

                    <Pressable
                        disabled={!canEdit || saving}
                        onPress={onSave}
                        style={{ backgroundColor: canEdit ? '#059669' : '#9CA3AF', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 }}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={{ color: 'white', fontWeight: '800' }}>حفظ التغييرات</Text>
                        )}
                    </Pressable>
                </ScrollView>
            )}
        </View>
    );
}

const FormField: React.FC<{
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'numeric';
    multiline?: boolean;
}> = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline }) => (
    <View style={{ marginBottom: 12 }}>
        <Text style={{ marginBottom: 6, color: '#374151', fontWeight: '700' }}>{label}</Text>
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: multiline ? 12 : 10,
                textAlign: 'right',
            }}
            keyboardType={keyboardType}
            multiline={!!multiline}
        />
    </View>
);


