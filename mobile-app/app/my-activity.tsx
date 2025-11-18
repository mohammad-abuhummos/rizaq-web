import { listAuctionsCreatedByUser } from '@/services/auction';
import { getMyProfile } from '@/services/auth';
import { listBuyerOrders, listDirectListings, listSellerOrders } from '@/services/direct';
import { listTendersCreatedByUser } from '@/services/tender';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

type TabId = 'tenders' | 'auctions' | 'listings' | 'buyerOrders' | 'sellerOrders';

export default function MyActivityScreen() {
    const [active, setActive] = useState<TabId>('tenders');
    const [userId, setUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [tenders, setTenders] = useState<any[]>([]);
    const [auctions, setAuctions] = useState<any[]>([]);
    const [listings, setListings] = useState<any[]>([]);
    const [buyerOrders, setBuyerOrders] = useState<any[]>([]);
    const [sellerOrders, setSellerOrders] = useState<any[]>([]);
    const [showInfo, setShowInfo] = useState<boolean>(false);
    const didInit = useRef(false);

    const title = useMemo(() => 'نشاطاتي', []);

    const load = useCallback(async (isRefresh = false, initialTab?: TabId) => {
        setError(null);
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            let uid = userId;
            if (!uid) {
                const me = await getMyProfile();
                uid = Number((me as any)?.userId);
                setUserId(uid || null);
            }
            if (!uid) throw new Error('تعذر تحديد المستخدم');

            const [tRes, aRes, lRes, bOrdersRes, sOrdersRes] = await Promise.all([
                listTendersCreatedByUser(uid).catch(() => ({ data: [] } as any)),
                listAuctionsCreatedByUser(uid).catch(() => ({ data: [] } as any)),
                listDirectListings().catch(() => ({ data: [] } as any)),
                listBuyerOrders(uid).catch(() => ({ data: [] } as any)),
                listSellerOrders(uid).catch(() => ({ data: [] } as any)),
            ]);

            const t = (tRes as any)?.data ?? tRes;
            const a = (aRes as any)?.data ?? aRes;
            const lRaw = (lRes as any)?.data ?? lRes;
            setTenders(Array.isArray(t) ? t : []);
            setAuctions(Array.isArray(a) ? a : []);
            const l = (Array.isArray(lRaw) ? lRaw : []).filter((x: any) => String(x?.sellerUserId || '') === String(uid));
            setListings(l);
            const b = (bOrdersRes as any)?.data ?? bOrdersRes;
            const s = (sOrdersRes as any)?.data ?? sOrdersRes;
            setBuyerOrders(Array.isArray(b) ? b : []);
            setSellerOrders(Array.isArray(s) ? s : []);
            if (initialTab) setActive(initialTab);
        } catch (e: any) {
            setError(e?.message || 'فشل تحميل بيانات نشاطاتي');
            setTenders([]);
            setAuctions([]);
            setListings([]);
        } finally {
            if (isRefresh) setRefreshing(false); else setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (didInit.current) return;
        didInit.current = true;
        load(false, 'tenders');
    }, [load]);

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-5 pt-14 pb-4 bg-white border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                    <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200">
                        <Ionicons name="arrow-forward" size={22} color="#1F2937" />
                    </Pressable>
                    <Text className="flex-1 mr-3 text-xl text-center text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>
                        {title}
                    </Text>
                    <Pressable onPress={() => setShowInfo(true)} className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200">
                        <Ionicons name="information-circle-outline" size={22} color="#047857" />
                    </Pressable>
                </View>
            </View>

            {/* Segmented control (press, not swipe) */}
            <View className="mb-2">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mx-4 mt-2" contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                    {([
                        { id: 'tenders', label: 'مناقصاتي', icon: 'document-text-outline' as const },
                        { id: 'auctions', label: 'مزاداتي', icon: 'hammer-outline' as const },
                        { id: 'listings', label: 'منتجاتي (البيع المباشر)', icon: 'pricetag-outline' as const },
                        { id: 'buyerOrders', label: 'طلباتي', icon: 'cart-outline' as const },
                        { id: 'sellerOrders', label: 'طلبات زبائني', icon: 'people-outline' as const },
                    ] as const).map((tab) => {
                        const isActive = active === (tab.id as TabId);
                        return (
                            <Pressable
                                key={tab.id}
                                onPress={() => setActive(tab.id as TabId)}
                            className={`flex-row items-center justify-center px-3 py-1.5 rounded-lg ${isActive ? 'bg-white' : 'bg-gray-100'} border border-gray-200`}
                            style={{ minWidth: 88, maxWidth: 220, flexShrink: 1 }}
                            >
                                <Ionicons name={tab.icon} size={14} color={isActive ? '#059669' : '#6B7280'} />
                            <Text
                                className={`mx-1 text-[11px] text-center ${isActive ? 'text-emerald-700' : 'text-gray-500'}`}
                                style={{ fontFamily: 'Cairo-SemiBold' }}
                                numberOfLines={2}
                                ellipsizeMode="tail"
                            >
                                {tab.label}
                            </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Content */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={["#059669"]} tintColor="#059669" />}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <View className="py-12 items-center">
                        <ActivityIndicator size="large" color="#059669" />
                        <Text className="mt-3 text-sm text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>جاري التحميل...</Text>
                    </View>
                ) : error ? (
                    <View className="p-4 bg-red-50 rounded-2xl border border-red-200">
                        <Text className="text-red-700" style={{ fontFamily: 'Cairo-Regular' }}>{error}</Text>
                        <Pressable onPress={() => load()} className="self-end mt-3 px-4 py-2 bg-red-500 rounded-lg">
                            <Text className="text-white text-xs" style={{ fontFamily: 'Cairo-Bold' }}>إعادة المحاولة</Text>
                        </Pressable>
                    </View>
                ) : (
                    <>
                        {active === 'tenders' && (
                            tenders.length === 0 ? (
                                <EmptyState icon="documents-outline" title="لا توجد مناقصات" subtitle="ابدأ بإنشاء مناقصة جديدة من صفحة المناقصات" />
                            ) : (
                                tenders.map((t: any) => (
                                    <CardRow
                                        key={String(t.tenderId)}
                                        title={t.title || t.cropName || 'مناقصة'}
                                        subtitle={`الحالة: ${t.status || 'غير معروف'}`}
                                        meta={`${(t.quantity || 0).toLocaleString()} ${t.unit || ''}`}
                                        right={formatDateShort(t.endTime)}
                                        icon="document-text-outline"
                                        onPress={() => router.push(`/tenders/${t.tenderId}` as any)}
                                    />
                                ))
                            )
                        )}

                        {active === 'auctions' && (
                            auctions.length === 0 ? (
                                <EmptyState icon="hammer-outline" title="لا توجد مزادات" subtitle="قم بإنشاء مزاد من صفحة المزادات" />
                            ) : (
                                auctions.map((a: any) => (
                                    <View key={String(a.auctionId)} className="mb-3 p-4 bg-white rounded-xl border border-gray-200">
                                        <View className="flex-row justify-between items-start">
                                            <View className="flex-1 ml-3 items-end">
                                                <Text className="text-base text-gray-900" style={{ fontFamily: 'Cairo-Bold' }} numberOfLines={1}>{a.auctionTitle || 'مزاد'}</Text>
                                                {!!a.auctionDescription && (
                                                    <Text className="mt-1 text-xs text-gray-600 text-right" style={{ fontFamily: 'Cairo-Regular' }}>{a.auctionDescription}</Text>
                                                )}
                                                <View className="flex-row gap-2 mt-2">
                                                    <Pill label={a.status || '—'} color="#059669" />
                                                    <Pill label={`#${a.cropId}`} color="#2563EB" />
                                                </View>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-emerald-700" style={{ fontFamily: 'Cairo-Bold' }}>{Number(a.startingPrice || 0).toLocaleString()} ل.س</Text>
                                                <Text className="mt-1 text-xs text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>يغلق: {formatDateShort(a.endTime)}</Text>
                                                <View className="flex-row mt-2 gap-2">
                                                    <Pressable onPress={() => router.push(`/auctions/${a.auctionId}` as any)} className="px-3 py-2 bg-emerald-600 rounded-lg">
                                                        <Text className="text-white text-xs" style={{ fontFamily: 'Cairo-Bold' }}>تفاصيل</Text>
                                                    </Pressable>
                                                    <Pressable onPress={() => router.push(`/auctions/edit/${a.auctionId}` as any)} className="px-3 py-2 bg-amber-500 rounded-lg">
                                                        <Text className="text-white text-xs" style={{ fontFamily: 'Cairo-Bold' }}>تعديل</Text>
                                                    </Pressable>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            )
                        )}

                        {active === 'listings' && (
                            listings.length === 0 ? (
                                <EmptyState icon="pricetag-outline" title="لا توجد منتجات" subtitle="أنشئ عرض بيع مباشر من صفحة البيع المباشر" />
                            ) : (
                                listings.map((l: any) => (
                                    <CardRow
                                        key={String(l.listingId)}
                                        title={l.title || l.cropName || 'منتج'}
                                        subtitle={`الكمية: ${(l.availableQty || 0).toLocaleString()} ${l.unit || ''}`}
                                        meta={`السعر: ${(l.unitPrice || 0).toLocaleString()} ل.س`}
                                        right={l.status || ''}
                                        icon="pricetag-outline"
                                    />
                                ))
                            )
                        )}

                        {active === 'buyerOrders' && (
                            buyerOrders.length === 0 ? (
                                <EmptyState icon="cart-outline" title="لا توجد طلبات" subtitle="ستظهر هنا الطلبات التي قمت بها كمشتري" />
                            ) : (
                                buyerOrders.map((o: any) => (
                                    <CardRow
                                        key={String(o.orderId)}
                                        title={`طلب #${o.orderId}`}
                                        subtitle={`الحالة: ${o.status || 'غير معروف'} • الدفع: ${o.paymentMethod || 'غير محدد'}`}
                                        meta={`الإجمالي: ${(o.total ?? o.subtotal ?? 0).toLocaleString()} ل.س`}
                                        right={formatDateShort(o.createdAt)}
                                        icon="cart-outline"
                                        onPress={() => router.push(`/direct/orders/${o.orderId}` as any)}
                                    />
                                ))
                            )
                        )}

                        {active === 'sellerOrders' && (
                            sellerOrders.length === 0 ? (
                                <EmptyState icon="people-outline" title="لا توجد طلبات زبائن" subtitle="ستظهر هنا الطلبات التي تستلمها كبائع" />
                            ) : (
                                sellerOrders.map((o: any) => (
                                    <CardRow
                                        key={String(o.orderId)}
                                        title={`طلب #${o.orderId}`}
                                        subtitle={`الحالة: ${o.status || 'غير معروف'} • الدفع: ${o.paymentMethod || 'غير محدد'}`}
                                        meta={`الإجمالي: ${(o.total ?? o.subtotal ?? 0).toLocaleString()} ل.س`}
                                        right={formatDateShort(o.createdAt)}
                                        icon="people-outline"
                                        onPress={() => router.push(`/direct/orders/${o.orderId}` as any)}
                                    />
                                ))
                            )
                        )}
                    </>
                )}
            </ScrollView>

            <InfoOverlay visible={showInfo} onClose={() => setShowInfo(false)} />
        </View>
    );
}

function formatDateShort(value?: string) {
    if (!value) return 'غير معروف';
    try {
        const d = new Date(value);
        return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return String(value);
    }
}

const Pill: React.FC<{ label: string; color?: string }> = ({ label, color = '#111827' }) => (
    <View className="px-2 py-1 rounded-full" style={{ backgroundColor: `${color}20` }}>
        <Text className="text-xs" style={{ color, fontFamily: 'Cairo-Bold' }}>{label}</Text>
    </View>
);

// Info dialog overlay
// Shown when user taps the info icon in header
// Explains difference between created vs joined items
// and the meaning of each tab
// Close with "حسناً فهمت"
const CardRow: React.FC<{
    title: string;
    subtitle?: string;
    meta?: string;
    right?: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress?: () => void;
}> = ({ title, subtitle, meta, right, icon, onPress }) => (
    <Pressable onPress={onPress} className="mb-3 p-4 bg-white rounded-xl border border-gray-200">
        <View className="flex-row items-center">
            <View className="justify-center items-center w-10 h-10 bg-emerald-50 rounded-xl">
                <Ionicons name={icon} size={18} color="#059669" />
            </View>
            <View className="flex-1 ml-3 items-stretch pr-10">
                <Text className="text-base text-gray-900 text-right" style={{ fontFamily: 'Cairo-Bold' }}>{title}</Text>
                {subtitle ? (
                    <Text className="mt-1 text-xs text-gray-600 text-right" style={{ fontFamily: 'Cairo-Regular' }}>{subtitle}</Text>
                ) : null}
                {meta ? (
                    <Text className="mt-2 text-emerald-700 text-right" style={{ fontFamily: 'Cairo-Bold' }}>{meta}</Text>
                ) : null}
            </View>
            {right ? (
                <Text className="ml-2 text-xs text-gray-500 flex-shrink-0" style={{ fontFamily: 'Cairo-Regular' }}>{right}</Text>
            ) : null}
        </View>
    </Pressable>
);

const EmptyState: React.FC<{ icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
    <View className="justify-center items-center py-12">
        <View className="justify-center items-center w-20 h-20 bg-emerald-50 rounded-full border border-emerald-100">
            <Ionicons name={icon} size={28} color="#059669" />
        </View>
        <Text className="mt-3 text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>{title}</Text>
        {subtitle ? (
            <Text className="mt-1 text-center text-sm text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>{subtitle}</Text>
        ) : null}
    </View>
);

function InfoOverlay({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    if (!visible) return null;
    return (
        <View className="absolute inset-0 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <View className="mx-6 p-5 bg-white rounded-2xl border border-gray-100">
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-lg text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>ما الذي ستجده هنا؟</Text>
                    <Pressable onPress={onClose} className="w-8 h-8 items-center justify-center rounded-xl bg-gray-100">
                        <Ionicons name="close" size={18} color="#111827" />
                    </Pressable>
                </View>
                <View className="gap-2">
                    <InfoLine icon="document-text-outline" title="مناقصاتي" desc="المناقصات التي أنشأتها أنت. ليست المناقصات المنضم إليها." />
                    <InfoLine icon="hammer-outline" title="مزاداتي" desc="المزادات التي أنشأتها أنت. ليست المزادات المنضم إليها." />
                    <InfoLine icon="pricetag-outline" title="منتجاتي (البيع المباشر)" desc="عروض البيع المباشر التي تبيعها أنت." />
                    <InfoLine icon="cart-outline" title="طلباتي" desc="الطلبات التي قمت بها كمشتري." />
                    <InfoLine icon="people-outline" title="طلبات زبائني" desc="الطلبات التي تستلمها كبائع." />
                </View>
                <Pressable onPress={onClose} className="mt-5 px-4 py-2 bg-emerald-600 rounded-xl active:bg-emerald-700">
                    <Text className="text-white text-center" style={{ fontFamily: 'Cairo-Bold' }}>حسناً فهمت</Text>
                </Pressable>
            </View>
        </View>
    );
}

function InfoLine({ icon, title, desc }: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }) {
    return (
        <View className="flex-row items-start">
            <View className="mt-0.5 mr-2 w-6 h-6 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-100">
                <Ionicons name={icon} size={14} color="#047857" />
            </View>
            <View className="flex-1 items-end">
                <Text className="text-sm text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>{title}</Text>
                <Text className="mt-0.5 text-xs text-gray-600" style={{ fontFamily: 'Cairo-Regular' }}>{desc}</Text>
            </View>
        </View>
    );
}

