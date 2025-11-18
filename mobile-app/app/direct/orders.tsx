import { listBuyerOrders } from '@/services/direct';
import { getAuthUser } from '@/storage/auth-storage';
import type { DirectOrder } from '@/types/direct';
import { ProfileMe } from '@/types/profile';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

const STATUS_STYLES: Record<string, { label: string; textClass: string; bgClass: string }> = {
    pending: { label: 'قيد المراجعة', textClass: 'text-amber-700', bgClass: 'bg-amber-100/80' },
    processing: { label: 'قيد التنفيذ', textClass: 'text-blue-700', bgClass: 'bg-blue-100/80' },
    completed: { label: 'مكتمل', textClass: 'text-emerald-700', bgClass: 'bg-emerald-100/80' },
    delivered: { label: 'تم التسليم', textClass: 'text-emerald-700', bgClass: 'bg-emerald-100/80' },
    cancelled: { label: 'ملغى', textClass: 'text-red-600', bgClass: 'bg-red-100/80' },
    rejected: { label: 'مرفوض', textClass: 'text-red-600', bgClass: 'bg-red-100/80' },
    default: { label: 'غير محدد', textClass: 'text-gray-600', bgClass: 'bg-gray-100' },
};

const formatDateTime = (value?: string | null) => {
    if (!value) return 'غير متوفر';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'غير متوفر';
    try {
        return date.toLocaleString('ar-EG', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return date.toLocaleString();
    }
};

const InfoRow: React.FC<{ icon: keyof typeof Ionicons.glyphMap; label: string; value: string | null | undefined }> = ({ icon, label, value }) => {
    if (!value) return null;
    return (
        <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
                <View className="w-10 h-10 items-center justify-center rounded-2xl bg-emerald-50">
                    <Ionicons name={icon} size={20} color="#047857" />
                </View>
                <Text className="text-sm text-gray-500 font-cairo">{label}</Text>
            </View>
            <Text className="text-sm text-gray-900 font-cairo-semibold" numberOfLines={2}>
                {value}
            </Text>
        </View>
    );
};

export default function MyDirectOrdersScreen() {
    const [orders, setOrders] = useState<DirectOrder[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { i18n } = useTranslation();
    const isEnglish = (i18n?.language || '').startsWith('en');
    const emptyText = isEnglish ? 'not defined' : 'لا يوجد';
    const displayValue = (v: any) => (v === null || v === undefined || v === '' ? emptyText : v);
    const dateLocale = isEnglish ? 'en-US' : 'ar';
    const [usersById, setUsersById] = useState<Record<number, ProfileMe>>({});

    const PAYMENT_METHOD_LABELS = {
        en: {
            cash: 'Cash',
            card: 'Card',
            bank_transfer: 'Bank Transfer',
            wallet: 'Wallet',
        },
        ar: {
            cash: 'نقداً',
            card: 'بطاقة',
            bank_transfer: 'تحويل بنكي',
            wallet: 'محفظة',
        },
    } as const;
    const formatPaymentMethod = (v?: string | null) => {
        if (!v) return emptyText;
        const key = String(v).toLowerCase();
        const labels = isEnglish ? PAYMENT_METHOD_LABELS.en : PAYMENT_METHOD_LABELS.ar;
        return (labels as any)[key] || v;
    };
    const formatUserLine = (u?: ProfileMe | null) => {
        if (!u) return emptyText;
        return `${u.fullName}${u.phone ? ` (${u.phone})` : ''}`;
    };

    const fetchOrders = useCallback(async (isRefreshing = false) => {
        if (isRefreshing) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const user = await getAuthUser<any>();
            const buyerId = user?.userId || user?.id;
            if (!buyerId) {
                throw new Error('تعذر تحديد هوية المستخدم.');
            }

            const res = await listBuyerOrders(buyerId);
            const data = (res as any)?.data ?? res;
            setOrders(Array.isArray(data) ? data : []);
        } catch (e: any) {
            setOrders([]);
            setError(e?.message || 'فشل في تحميل طلباتك.');
        } finally {
            if (isRefreshing) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );

    const onRefresh = useCallback(() => {
        fetchOrders(true);
    }, [fetchOrders]);

    const renderOrders = useMemo(() => {
        if (orders.length === 0) {
            return (
                <View className="items-center justify-center py-16">
                    <View className="w-20 h-20 items-center justify-center rounded-full bg-gray-100">
                        <Ionicons name="document-text-outline" size={36} color="#9CA3AF" />
                    </View>
                    <Text className="mt-4 text-lg text-gray-700 font-cairo-bold">لا توجد طلبات مباشرة حتى الآن</Text>
                    <Text className="mt-2 text-sm text-gray-500 font-cairo text-center">
                        ابدأ بالشراء من قسم البيع المباشر لعرض طلباتك هنا
                    </Text>
                    <Pressable
                        onPress={() => router.push('/(tabs)')}
                        className="mt-6 px-5 py-2.5 bg-emerald-600 rounded-2xl active:bg-emerald-700"
                    >
                        <Text className="text-sm text-white font-cairo-semibold">العودة إلى الصفحة الرئيسية</Text>
                    </Pressable>
                </View>
            );
        }

        return orders.map((order) => {
            const statusKey = (order.status || '').toLowerCase();
            const statusStyle = STATUS_STYLES[statusKey] || STATUS_STYLES.default;

            return (
                <Pressable key={order.orderId} onPress={() => router.push({ pathname: '/direct/orders/[id]', params: { id: String(order.orderId) } })} className="p-5 mb-4 bg-white rounded-3xl border border-gray-100 shadow-sm active:bg-gray-50">
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1 items-end">
                            <Text className="text-xs text-gray-500 font-cairo">رقم الطلب</Text>
                            <Text className="text-lg text-gray-900 font-cairo-bold">#{order.orderId}</Text>
                            <Text className="mt-1 text-xs text-gray-400 font-cairo">أنشئ في {formatDateTime(order.createdAt)}</Text>
                        </View>
                        <View className={`px-3 py-1 rounded-full ${statusStyle.bgClass}`}>
                            <Text className={`text-xs font-cairo-semibold ${statusStyle.textClass}`}>
                                {statusStyle.label}
                            </Text>
                        </View>
                    </View>

                    <View className="mt-5 gap-3">
                        <InfoRow icon="pricetag-outline" label="رقم العرض" value={`#${order.listingId}`} />
                        <InfoRow icon="cube-outline" label="الكمية" value={String(order.qty)} />
                        <InfoRow icon="location-outline" label="عنوان التوصيل" value={order.deliveryAddress?.trim() || null} />
                        <InfoRow icon="card-outline" label="طريقة الدفع" value={order.paymentMethod?.trim() || null} />
                    </View>
                    <View className="mt-4 items-end">
                        <Pressable
                            onPress={() => router.push({ pathname: '/direct/orders/[id]', params: { id: String(order.orderId) } })}
                            className="px-4 py-2 bg-emerald-600 rounded-xl active:bg-emerald-700"
                        >
                            <Text className="text-white text-sm" style={{ fontFamily: 'Cairo-SemiBold' }}>عرض التفاصيل</Text>
                        </Pressable>
                    </View>
                </Pressable>
            );
        });
    }, [orders]);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View className="flex-1 bg-gray-50">
                <View className="flex-1">
                    <View className="pb-6 bg-emerald-600 rounded-b-3xl shadow-md">
                        <View className="px-5 pt-14 pb-6">
                            <View className="flex-row items-center justify-between">
                                <Pressable
                                    onPress={() => router.back()}
                                    className="p-2 rounded-full bg-white/10"
                                    hitSlop={8}
                                >
                                    <Ionicons name="arrow-forward" size={22} color="white" />
                                </Pressable>
                                <View className="flex-1 mr-3 items-end">
                                    <Text className="text-2xl text-white font-cairo-bold">طلباتي المباشرة</Text>
                                    <Text className="mt-1 text-sm text-emerald-100 font-cairo">
                                        تابع حالة طلبات الشراء الخاصة بك بسهولة
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <ScrollView
                        style={{ flex: 1, marginTop: -32 }}
                        contentContainerStyle={{ paddingTop: 32, paddingHorizontal: 20, paddingBottom: 48 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#059669']}
                                tintColor="#059669"
                            />
                        }
                    >
                        {loading ? (
                            <View className="items-center justify-center py-12">
                                <ActivityIndicator size="large" color="#059669" />
                                <Text className="mt-3 text-sm text-gray-500 font-cairo">جاري تحميل طلباتك...</Text>
                            </View>
                        ) : (
                            <>
                                {error && (
                                    <View className="px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-2xl">
                                        <Text className="text-sm text-red-700 font-cairo">{error}</Text>
                                        <Pressable
                                            onPress={() => fetchOrders()}
                                            className="mt-3 self-end px-4 py-2 bg-red-500 rounded-xl active:bg-red-600"
                                        >
                                            <Text className="text-xs text-white font-cairo-semibold">إعادة المحاولة</Text>
                                        </Pressable>
                                    </View>
                                )}

                                {!error && renderOrders}
                            </>
                        )}
                    </ScrollView>
                </View>
            </View>
        </>
    );
}


