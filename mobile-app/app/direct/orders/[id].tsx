import { getDirectOrder } from '@/services/direct';
import { getUserById } from '@/services/users';
import type { DirectOrder } from '@/types/direct';
import type { ProfileMe } from '@/types/profile';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

export default function DirectOrderDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [order, setOrder] = useState<DirectOrder | null>(null);
    const [buyer, setBuyer] = useState<ProfileMe | null>(null);
    const [seller, setSeller] = useState<ProfileMe | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const formatDateTime = (value?: string | null) => {
        if (!value) return 'غير متوفر';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'غير متوفر';
        try {
            return date.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
        } catch {
            return date.toLocaleString();
        }
    };

    const load = useCallback(async () => {
        if (!id) {
            setError('معرّف الطلب غير صالح');
            setLoading(false);
            return;
        }
        try {
            setError(null);
            setLoading(true);
            const res = await getDirectOrder(Number(id));
            const data = (res as any)?.data ?? res;
            setOrder(data as DirectOrder);
            // Fetch buyer/seller in parallel when available
            const promises: Array<Promise<any>> = [];
            if (data?.buyerUserId) promises.push(getUserById(Number(data.buyerUserId)).catch(() => null));
            if (data?.sellerUserId) promises.push(getUserById(Number(data.sellerUserId)).catch(() => null));
            const results = await Promise.all(promises);
            if (data?.buyerUserId) setBuyer(results[0]?.data ?? results[0]);
            if (data?.sellerUserId) setSeller((results.length === 2 ? results[1] : results[0])?.data ?? (results.length === 2 ? results[1] : results[0]));
        } catch (e: any) {
            setError(e?.message || 'فشل تحميل تفاصيل الطلب');
            setOrder(null);
            setBuyer(null);
            setSeller(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const statusBadge = useMemo(() => {
        const key = String(order?.status || '').toLowerCase();
        const map: Record<string, { label: string; bg: string; text: string }> = {
            created: { label: 'تم الإنشاء', bg: 'bg-blue-100/80', text: 'text-blue-700' },
            pending: { label: 'قيد المراجعة', bg: 'bg-amber-100/80', text: 'text-amber-700' },
            processing: { label: 'قيد التنفيذ', bg: 'bg-blue-100/80', text: 'text-blue-700' },
            completed: { label: 'مكتمل', bg: 'bg-emerald-100/80', text: 'text-emerald-700' },
            delivered: { label: 'تم التسليم', bg: 'bg-emerald-100/80', text: 'text-emerald-700' },
            cancelled: { label: 'ملغى', bg: 'bg-red-100/80', text: 'text-red-600' },
            rejected: { label: 'مرفوض', bg: 'bg-red-100/80', text: 'text-red-600' },
            default: { label: 'غير محدد', bg: 'bg-gray-100', text: 'text-gray-600' },
        };
        return map[key] || map.default;
    }, [order?.status]);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color="#059669" />
                <Text className="mt-3 text-gray-500 font-cairo">جاري تحميل الطلب...</Text>
            </View>
        );
    }

    if (error || !order) {
        return (
            <View className="flex-1 justify-center items-center bg-white px-6">
                <Stack.Screen options={{ headerShown: false }} />
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text className="mt-4 text-xl text-center text-gray-800 font-cairo-bold">{error || 'حدث خطأ'}</Text>
                <Pressable onPress={() => router.back()} className="px-6 py-3 mt-6 bg-emerald-700 rounded-lg active:bg-emerald-800">
                    <Text className="text-white font-cairo-bold">العودة</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View className="flex-1 bg-gray-50">
                {/* Header */}
                <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
                    <Pressable onPress={() => router.back()} className="justify-center items-center w-10 h-10 bg-gray-100 rounded-lg active:bg-gray-200">
                        <Ionicons name="arrow-forward" size={24} color="#1F2937" />
                    </Pressable>
                    <Text className="flex-1 mr-10 text-xl text-center text-gray-900 font-cairo-bold">تفاصيل الطلب #{order.orderId}</Text>
                </View>

                <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
                    {/* Status */}
                    <View className={`px-3 py-2 self-start rounded-full ${statusBadge.bg}`}>
                        <Text className={`text-xs font-cairo-semibold ${statusBadge.text}`}>{statusBadge.label}</Text>
                    </View>

                    {/* Summary */}
                    <View className="p-5 mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-sm text-gray-600 font-cairo">أنشئ في</Text>
                            <Text className="text-sm text-gray-900 font-cairo-bold">{formatDateTime(order.createdAt)}</Text>
                        </View>
                        <View className="flex-row justify-between items-center mt-2">
                            <Text className="text-sm text-gray-600 font-cairo">طريقة الدفع</Text>
                            <Text className="text-sm text-gray-900 font-cairo-bold">{order.paymentMethod || 'غير محدد'}</Text>
                        </View>
                        <View className="flex-row justify-between items-center mt-2">
                            <Text className="text-sm text-gray-600 font-cairo">الإجمالي</Text>
                            <Text className="text-sm text-emerald-700 font-cairo-bold">{(order.total ?? order.subtotal ?? 0).toLocaleString()} ل.س</Text>
                        </View>
                    </View>

                    {/* Parties */}
                    <View className="p-5 mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <Text className="mb-3 text-lg text-gray-900 font-cairo-bold">الأطراف</Text>
                        <View className="gap-4">
                            <View>
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-sm text-gray-600 font-cairo">المشتري</Text>
                                    <Text className="text-sm text-gray-900 font-cairo-bold">{buyer?.fullName || order.buyerUserId}</Text>
                                </View>
                                {buyer?.phone ? (
                                    <View className="flex-row justify-between items-center mt-1">
                                        <Text className="text-xs text-gray-500 font-cairo">هاتف</Text>
                                        <Text className="text-xs text-gray-800 font-cairo-semibold">{buyer.phone}</Text>
                                    </View>
                                ) : null}
                            </View>

                            <View>
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-sm text-gray-600 font-cairo">البائع</Text>
                                    <Text className="text-sm text-gray-900 font-cairo-bold">{seller?.fullName || order.sellerUserId}</Text>
                                </View>
                                {seller?.phone ? (
                                    <View className="flex-row justify-between items-center mt-1">
                                        <Text className="text-xs text-gray-500 font-cairo">هاتف</Text>
                                        <Text className="text-xs text-gray-800 font-cairo-semibold">{seller.phone}</Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>
                    </View>

                    {/* Delivery */}
                    <View className="p-5 mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <Text className="mb-3 text-lg text-gray-900 font-cairo-bold">التوصيل</Text>
                        <View className="flex-row justify-between items-center">
                            <Text className="text-sm text-gray-600 font-cairo">العنوان</Text>
                            <Text className="text-sm text-gray-900 font-cairo-bold">{order.deliveryAddress || 'غير محدد'}</Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </>
    );
}


