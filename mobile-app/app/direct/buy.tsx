import { createDirectOrder, getDirectListing } from '@/services/direct';
import { pushLocalNotification } from '@/services/localNotificationService';
import { getAuthUser } from '@/storage/auth-storage';
import type { DirectListing } from '@/types/direct';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

type PaymentMethodOption = {
    id: string;
    label: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
};

const PAYMENT_METHODS: PaymentMethodOption[] = [
    {
        id: 'card',
        label: 'بطاقة بنكية',
        description: 'Visa / MasterCard',
        icon: 'card-outline',
    },
    {
        id: 'wallet',
        label: 'محفظة إلكترونية',
        description: 'محفظة أونلاين موثوقة',
        icon: 'wallet-outline',
    },
   
];

const simulatePayment = () => new Promise<void>((resolve) => setTimeout(resolve, 1200));

interface PaymentMethodCardProps {
    method: PaymentMethodOption;
    selected: boolean;
    onSelect: () => void;
    disabled?: boolean;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({ method, selected, onSelect, disabled }) => {
    const scale = useRef(new Animated.Value(selected ? 1.04 : 1)).current;

    useEffect(() => {
        const anim = Animated.spring(scale, {
            toValue: selected ? 1.04 : 1,
            // Use JS driver to avoid rare native driver crashes on some Android devices when unmounting mid-animation
            useNativeDriver: false,
            friction: 6,
            tension: 120,
        });
        anim.start();
        return () => {
            try { (scale as any).stopAnimation && (scale as any).stopAnimation(); } catch { }
        };
    }, [selected, scale]);

    return (
        <Pressable onPress={onSelect} disabled={disabled} className="active:opacity-80">
            <Animated.View
                className={`px-4 py-4 rounded-2xl border ${selected ? 'bg-emerald-50 border-emerald-400 shadow-lg shadow-emerald-100' : 'bg-white border-gray-200 shadow-sm'}`}
                style={{ transform: [{ scale }] }}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                        <Text className={`text-base font-cairo-bold ${selected ? 'text-emerald-700' : 'text-gray-800'}`}>{method.label}</Text>
                        <Text className="mt-1 text-sm text-gray-500 font-cairo">{method.description}</Text>
                    </View>
                    <View className={`w-12 h-12 items-center justify-center rounded-2xl ${selected ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                        <Ionicons name={method.icon} size={22} color={selected ? '#047857' : '#6B7280'} />
                    </View>
                </View>
            </Animated.View>
        </Pressable>
    );
};

export default function DirectBuyScreen() {
    const params = useLocalSearchParams();
    const listingId = Number(params?.id);
    const [listing, setListing] = useState<DirectListing | null>(null);
    const [buyerUserId, setBuyerUserId] = useState<number | null>(null);
    const [qty, setQty] = useState<string>('');
    const [deliveryAddress, setDeliveryAddress] = useState<string>('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const [listingLoading, setListingLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setListingLoading(true);
            setError(null);
            try {
                const u = await getAuthUser<any>();
                if (isMounted) {
                    setBuyerUserId(u?.userId || u?.id || null);
                }

                if (!listingId || Number.isNaN(listingId)) {
                    if (isMounted) {
                        setError('تعذر العثور على العرض المطلوب');
                        setListing(null);
                    }
                    return;
                }

                const res = await getDirectListing(listingId);
                const data = (res as any)?.data ?? res;
                if (isMounted) {
                    if (data) {
                        setListing(data);
                        setQty(data?.minOrderQty ? String(data.minOrderQty) : '');
                    } else {
                        setListing(null);
                        setError('لم يتم العثور على هذا العرض');
                    }
                }
            } catch (e: any) {
                if (isMounted) {
                    setListing(null);
                    setError(e?.message || 'فشل في تحميل تفاصيل العرض');
                }
            } finally {
                if (isMounted) {
                    setListingLoading(false);
                }
            }
        };

        load();
        return () => {
            isMounted = false;
        };
    }, [listingId]);

    const selectedMethod = useMemo(
        () => PAYMENT_METHODS.find((method) => method.id === selectedPaymentMethod) || null,
        [selectedPaymentMethod]
    );

    const onBuy = async () => {
        if (submitting) return;
        if (!buyerUserId || !listingId || !listing) {
            setError('حدث خطأ في تحميل بيانات المستخدم أو العرض.');
            return;
        }

        const numQty = Number(qty);
        if (!numQty || numQty <= 0) {
            setError('يرجى إدخال كمية صحيحة.');
            return;
        }

        if (numQty < listing.minOrderQty) {
            setError(`الحد الأدنى للطلب هو ${listing.minOrderQty}.`);
            return;
        }
        if (listing.maxOrderQty && numQty > listing.maxOrderQty) {
            setError(`الحد الأقصى للطلب هو ${listing.maxOrderQty}.`);
            return;
        }
        if (numQty > listing.availableQty) {
            setError(`الكمية المتاحة هي ${listing.availableQty} فقط.`);
            return;
        }

        if (!deliveryAddress.trim()) {
            setError('يرجى إدخال عنوان التوصيل.');
            return;
        }

        if (!selectedMethod) {
            setError('يرجى اختيار طريقة الدفع.');
            return;
        }

        setError(null);
        setSubmitting(true);

        try {
            await simulatePayment();
            const orderResponse = await createDirectOrder({
                listingId,
                buyerUserId,
                qty: numQty,
                deliveryAddress: deliveryAddress.trim(),
                paymentMethod: selectedMethod.label,
            });

            const orderData = (orderResponse as any)?.data ?? orderResponse;
            const normalizeId = (value: any): number | undefined => {
                const parsed = Number(
                    value?.orderId ??
                    value?.id ??
                    value?.order?.orderId ??
                    value?.order?.id ??
                    value
                );
                return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
            };

            const createdOrderId = normalizeId(orderData);
            const chatIdCandidate =
                orderData?.chatId ??
                orderData?.conversationId ??
                orderData?.conversation?.conversationId ??
                orderData?.chat?.conversationId ??
                orderData?.chat?.chatId;
            const createdChatId = normalizeId(chatIdCandidate);

            const listingName = listing.title?.trim() || listing.cropName?.trim() || 'الطلب المباشر';

            try {
                await pushLocalNotification({
                    title: '✅ تم إرسال طلبك',
                    body: `تم تقديم طلبك للعرض ${listingName}.`,
                    action: createdChatId
                        ? {
                            type: 'navigate',
                            route: '/chat/[conversationId]',
                            params: { conversationId: String(createdChatId) },
                        }
                        : createdOrderId
                            ? {
                                type: 'navigate',
                                route: '/direct/orders/[id]',
                                params: { id: String(createdOrderId) },
                            }
                            : {
                                type: 'navigate',
                                route: '/direct/orders',
                            },
                    data: {
                        listingId: String(listingId),
                        ...(createdOrderId ? { orderId: String(createdOrderId) } : {}),
                        ...(createdChatId ? { chatId: String(createdChatId) } : {}),
                    },
                });
            } catch (notificationError) {
                console.warn('Failed to push local notification for direct order', notificationError);
            }

            const navigateToSuccessDestination = () => {
                if (createdChatId) {
                    router.replace({
                        pathname: '/chat/[conversationId]',
                        params: { conversationId: String(createdChatId) },
                    });
                    return;
                }

                if (createdOrderId) {
                    router.replace({
                        pathname: '/direct/orders/[id]',
                        params: { id: String(createdOrderId) },
                    });
                    return;
                }

                router.replace({ pathname: '/direct/orders' });
            };

            Alert.alert('تم إرسال الطلب', 'سنقوم بالتواصل معك لإتمام العملية.', [
                {
                    text: 'حسناً',
                    onPress: navigateToSuccessDestination,
                },
            ]);
        } catch (e: any) {
            const message = e?.message || e?.detail || e?.response?.error?.detail || 'فشل في تنفيذ الطلب.';
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

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
                                    <Text className="text-2xl text-white font-cairo-bold">إكمال عملية الشراء</Text>
                                    <Text className="mt-1 text-sm text-emerald-100 font-cairo">
                                        راجع تفاصيل العرض وأدخل معلومات الطلب
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <ScrollView
                        style={{ flex: 1, marginTop: -32 }}
                        contentContainerStyle={{ paddingTop: 32, paddingHorizontal: 20, paddingBottom: 48 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {listingLoading ? (
                            <View className="items-center justify-center py-12">
                                <ActivityIndicator size="large" color="#059669" />
                                <Text className="mt-3 text-sm text-gray-500 font-cairo">جاري تحميل تفاصيل العرض...</Text>
                            </View>
                        ) : (
                            <>
                                {error && (
                                    <View className="px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-2xl">
                                        <Text className="text-sm text-red-700 font-cairo">{error}</Text>
                                    </View>
                                )}

                                {listing ? (
                                    <>
                                        <View className="p-5 mb-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                            <View className="flex-row justify-between items-start">
                                                <View className="flex-1 items-end">
                                                    <Text className="text-lg text-gray-900 font-cairo-bold" numberOfLines={1}>
                                                        {listing.title || listing.cropName || 'عرض للبيع المباشر'}
                                                    </Text>
                                                    {listing.cropName ? (
                                                        <Text className="mt-1 text-sm text-gray-500 font-cairo" numberOfLines={1}>
                                                            {listing.cropName}
                                                        </Text>
                                                    ) : null}
                                                </View>
                                                <View className="items-end">
                                                    <Text className="text-xs text-gray-500 font-cairo">السعر للوحدة</Text>
                                                    <Text className="text-lg text-emerald-700 font-cairo-bold">
                                                        {listing.unitPrice} / {listing.unit || '-'}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View className="mt-5 gap-3">
                                                <View className="flex-row items-center justify-between">
                                                    <View className="flex-row items-center gap-2">
                                                        <View className="w-10 h-10 items-center justify-center rounded-2xl bg-emerald-50">
                                                            <Ionicons name="cube-outline" size={20} color="#047857" />
                                                        </View>
                                                        <Text className="text-sm text-gray-500 font-cairo">الكمية المتاحة</Text>
                                                    </View>
                                                    <Text className="text-sm text-gray-900 font-cairo-semibold">{listing.availableQty}</Text>
                                                </View>

                                                <View className="flex-row items-center justify-between">
                                                    <View className="flex-row items-center gap-2">
                                                        <View className="w-10 h-10 items-center justify-center rounded-2xl bg-emerald-50">
                                                            <Ionicons name="trending-up-outline" size={20} color="#047857" />
                                                        </View>
                                                        <Text className="text-sm text-gray-500 font-cairo">الحد الأدنى للطلب</Text>
                                                    </View>
                                                    <Text className="text-sm text-gray-900 font-cairo-semibold">{listing.minOrderQty}</Text>
                                                </View>

                                                {listing.maxOrderQty ? (
                                                    <View className="flex-row items-center justify-between">
                                                        <View className="flex-row items-center gap-2">
                                                            <View className="w-10 h-10 items-center justify-center rounded-2xl bg-emerald-50">
                                                                <Ionicons name="speedometer-outline" size={20} color="#047857" />
                                                            </View>
                                                            <Text className="text-sm text-gray-500 font-cairo">الحد الأقصى للطلب</Text>
                                                        </View>
                                                        <Text className="text-sm text-gray-900 font-cairo-semibold">{listing.maxOrderQty}</Text>
                                                    </View>
                                                ) : null}
                                            </View>
                                        </View>

                                        {/* <View className="mb-6">
                                            <Text className="text-base text-gray-800 font-cairo-semibold text-right">الكمية المطلوبة</Text>
                                            <Text className="mt-1 text-sm text-gray-500 font-cairo text-right">
                                                يرجى إدخال كمية ضمن الحدود المتاحة
                                            </Text>
                                            <TextInput
                                                value={qty}
                                                onChangeText={setQty}
                                                keyboardType="numeric"
                                                placeholder="أدخل الكمية المطلوبة"
                                                placeholderTextColor="#9CA3AF"
                                                textAlign="right"
                                                className="w-full mt-3 px-4 py-3 text-base text-gray-900 bg-white border border-gray-200 rounded-2xl font-cairo"
                                            />
                                        </View> */}

                                        <View className="mb-6">
                                            <Text className="text-base text-gray-800 font-cairo-semibold text-right">عنوان التوصيل</Text>
                                            <TextInput
                                                value={deliveryAddress}
                                                onChangeText={setDeliveryAddress}
                                                placeholder="أدخل عنوان التوصيل بالتفصيل"
                                                placeholderTextColor="#9CA3AF"
                                                textAlign="right"
                                                className="w-full mt-3 px-4 py-3 text-base text-gray-900 bg-white border border-gray-200 rounded-2xl font-cairo"
                                                multiline
                                            />
                                        </View>

                                        <View className="mb-6">
                                            <Text className="text-base text-gray-800 font-cairo-semibold text-right">طريقة الدفع</Text>
                                            <Text className="mt-1 text-sm text-gray-500 font-cairo text-right">
                                                اختر الطريقة المناسبة لك لإتمام العملية
                                            </Text>

                                            <View className="mt-4 gap-3">
                                                {PAYMENT_METHODS.map((method) => (
                                                    <PaymentMethodCard
                                                        key={method.id}
                                                        method={method}
                                                        selected={selectedPaymentMethod === method.id}
                                                        onSelect={() => setSelectedPaymentMethod(method.id)}
                                                        disabled={submitting}
                                                    />
                                                ))}
                                            </View>
                                        </View>

                                        <Pressable
                                            onPress={onBuy}
                                            disabled={submitting}
                                            className={`flex-row items-center justify-center gap-2 px-4 py-3 rounded-2xl ${submitting ? 'bg-emerald-400' : 'bg-emerald-600'} active:bg-emerald-700`}
                                        >
                                            {submitting ? (
                                                <ActivityIndicator size="small" color="#FFFFFF" />
                                            ) : (
                                                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                            )}
                                            <Text className="text-base text-white font-cairo-semibold">
                                                {submitting ? 'جاري معالجة الطلب...' : 'تأكيد الطلب والدفع'}
                                            </Text>
                                        </Pressable>
                                    </>
                                ) : (
                                    <View className="items-center justify-center py-16">
                                        <Ionicons name="sad-outline" size={48} color="#9CA3AF" />
                                        <Text className="mt-4 text-base text-gray-500 font-cairo">
                                            لا تتوفر تفاصيل هذا العرض حالياً
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}
                    </ScrollView>
                </View>

                {submitting && (
                    <View className="absolute inset-0 z-50 items-center justify-center bg-black/40">
                        <View className="items-center gap-3 px-6 py-5 bg-white rounded-3xl shadow-lg">
                            <ActivityIndicator size="large" color="#059669" />
                            <Text className="text-base text-gray-700 font-cairo-semibold">
                                جاري معالجة الدفع عبر {selectedMethod?.label || 'الطريقة المختارة'}
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        </>
    );
}


