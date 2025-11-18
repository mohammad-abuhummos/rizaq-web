import { listAuctionsCreatedByUser } from '@/services/auction';
import { getMyProfile } from '@/services/auth';
import { listDirectListings } from '@/services/direct';
import { listTendersCreatedByUser } from '@/services/tender';
import { clearAuth, getAuthUser } from '@/storage/auth-storage';
import type { ProfileMe } from '@/types/profile';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Button, Pressable, ScrollView, Text, View } from 'react-native';

export default function ProfileScreen() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<ProfileMe | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showCenter, setShowCenter] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'auctions' | 'tenders' | 'listings'>('tenders');

    // Data states
    const [myAuctions, setMyAuctions] = useState<any[]>([]);
    const [myTenders, setMyTenders] = useState<any[]>([]);
    const [myListings, setMyListings] = useState<any[]>([]);
    const [loadingTabs, setLoadingTabs] = useState<boolean>(false);
    const [tabsError, setTabsError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            const u = await getAuthUser();
            setUser(u);
            try {
                const p = await getMyProfile();
                setProfile(p);
            } catch (e: any) {
                setError(e?.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const onLogout = async () => {
        await clearAuth();
        Alert.alert('Logged out');
        router.replace('/login');
    };

    const displayName = profile?.fullName || user?.fullName || user?.name || 'User';
    const displayId = String(profile?.userId || user?.userId || user?.id || '');
    const displayEmail = profile?.email || user?.email || '';
    const displayPhone = profile?.phone || user?.phone || '';

    const userId = useMemo(() => profile?.userId || user?.userId || user?.id, [profile, user]);

    const loadMyCenter = async (target?: 'auctions' | 'tenders' | 'listings') => {
        if (!userId) return;
        setLoadingTabs(true);
        setTabsError(null);
        try {
            // Load all in parallel for snappy tab switching
            const [auctionsRes, tendersRes, listingsRes] = await Promise.all([
                listAuctionsCreatedByUser(Number(userId)).catch(() => ({ data: [] } as any)),
                listTendersCreatedByUser(Number(userId)).catch(() => ({ data: [] } as any)),
                listDirectListings().catch(() => ({ data: [] } as any)),
            ]);
            const a = (auctionsRes as any)?.data ?? auctionsRes;
            const t = (tendersRes as any)?.data ?? tendersRes;
            const l = (listingsRes as any)?.data ?? listingsRes;
            setMyAuctions(Array.isArray(a) ? a : []);
            setMyTenders(Array.isArray(t) ? t : []);
            const filtered = (Array.isArray(l) ? l : []).filter((x: any) => String(x?.sellerUserId || '') === String(userId));
            setMyListings(filtered);
            if (target) setActiveTab(target);
        } catch (e: any) {
            setTabsError(e?.message || 'تعذر تحميل بيانات نشاطاتي');
        } finally {
            setLoadingTabs(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 28, fontWeight: '700' }}>{(displayName || 'U').charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '700', marginTop: 12 }}>{displayName}</Text>
                {!!displayId && <Text style={{ color: '#6b7280', marginTop: 4 }}>ID: {displayId}</Text>}
            </View>

            {loading && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <ActivityIndicator />
                    <Text style={{ marginLeft: 8 }}>Loading profile…</Text>
                </View>
            )}
            {!!error && (
                <View style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 16 }}>
                    <Text style={{ color: '#991B1B' }}>{error}</Text>
                </View>
            )}

            <View style={{ backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 }}>
                <Text style={{ fontWeight: '600', marginBottom: 8 }}>Account</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: '#6b7280' }}>Name</Text>
                    <Text style={{ fontWeight: '600' }}>{displayName}</Text>
                </View>
                {!!displayId && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ color: '#6b7280' }}>User ID</Text>
                        <Text style={{ fontWeight: '600' }}>{displayId}</Text>
                    </View>
                )}
                {!!displayEmail && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ color: '#6b7280' }}>Email</Text>
                        <Text style={{ fontWeight: '600' }}>{displayEmail}</Text>
                    </View>
                )}
                {!!displayPhone && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#6b7280' }}>Phone</Text>
                        <Text style={{ fontWeight: '600' }}>{displayPhone}</Text>
                    </View>
                )}
            </View>

            {/* نشاطاتي button */}
            <Pressable
                onPress={async () => {
                    const next = !showCenter;
                    setShowCenter(next);
                    if (next && userId) {
                        await loadMyCenter('tenders');
                    }
                }}
                style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                    backgroundColor: '#059669', paddingVertical: 12, borderRadius: 12, marginBottom: 12,
                }}
            >
                <Ionicons name={showCenter ? 'chevron-down' : 'chevron-up'} size={18} color="#FFFFFF" />
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>نشاطاتي</Text>
            </Pressable>

            {showCenter && (
                <View style={{ backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' }}>
                    {/* Segmented control */}
                    <View style={{ flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 6 }}>
                        {[
                            { id: 'tenders', label: 'مناقصاتي', icon: 'document-text-outline' as const },
                            { id: 'auctions', label: 'مزاداتي', icon: 'hammer-outline' as const },
                            { id: 'listings', label: 'منتجاتي', icon: 'pricetag-outline' as const },
                        ].map((tab) => {
                            const isActive = activeTab === (tab.id as any);
                            return (
                                <Pressable
                                    key={tab.id}
                                    onPress={() => setActiveTab(tab.id as any)}
                                    style={{
                                        flex: 1,
                                        backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                                        borderRadius: 12,
                                        paddingVertical: 10,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        gap: 6,
                                    }}
                                >
                                    <Ionicons name={tab.icon} size={16} color={isActive ? '#059669' : '#6B7280'} />
                                    <Text style={{ color: isActive ? '#059669' : '#6B7280', fontWeight: '700' }}>{tab.label}</Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Content */}
                    <View style={{ padding: 14 }}>
                        {loadingTabs ? (
                            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                                <ActivityIndicator color="#059669" />
                                <Text style={{ marginTop: 8, color: '#6B7280' }}>جاري التحميل...</Text>
                            </View>
                        ) : tabsError ? (
                            <View style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1, padding: 12, borderRadius: 12 }}>
                                <Text style={{ color: '#991B1B' }}>{tabsError}</Text>
                                <Pressable onPress={() => loadMyCenter()} style={{ marginTop: 8, alignSelf: 'flex-end', backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}>
                                    <Text style={{ color: 'white', fontWeight: '700' }}>إعادة المحاولة</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <>
                                {activeTab === 'tenders' && (
                                    <>
                                        {myTenders.length === 0 ? (
                                            <EmptyState icon="documents-outline" title="لا توجد مناقصات" subtitle="ابدأ بإنشاء مناقصة جديدة من صفحة المناقصات" />
                                        ) : (
                                            myTenders.map((t: any) => (
                                                <CardRow
                                                    key={String(t.tenderId)}
                                                    title={t.title || t.cropName || 'مناقصة'}
                                                    subtitle={`الحالة: ${t.status || 'غير معروف'}`}
                                                    meta={`${(t.quantity || 0).toLocaleString()} ${t.unit || ''}`}
                                                    right={`إغلاق: ${formatDateShort(t.endTime)}`}
                                                    icon="document-text-outline"
                                                    onPress={() => router.push(`/tenders/${t.tenderId}` as any)}
                                                />
                                            ))
                                        )}
                                    </>
                                )}

                                {activeTab === 'auctions' && (
                                    <>
                                        {myAuctions.length === 0 ? (
                                            <EmptyState icon="hammer-outline" title="لا توجد مزادات" subtitle="قم بإنشاء مزاد من صفحة المزادات" />
                                        ) : (
                                            myAuctions.map((a: any) => (
                                                <View key={String(a.auctionId)} style={{ marginBottom: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: 'white', padding: 12 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <View style={{ flex: 1, marginRight: 8 }}>
                                                            <Text style={{ fontWeight: '700', fontSize: 16 }} numberOfLines={1}>{a.auctionTitle || 'مزاد'}</Text>
                                                            <Text style={{ color: '#6B7280', marginTop: 4 }} numberOfLines={2}>{a.auctionDescription || '—'}</Text>
                                                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, alignItems: 'center' }}>
                                                                <Pill label={a.status || '—'} color="#059669" />
                                                                <Pill label={`#${a.cropId}`} color="#2563EB" />
                                                            </View>
                                                        </View>
                                                        <View style={{ alignItems: 'flex-end' }}>
                                                            <Text style={{ color: '#059669', fontWeight: '800' }}>{Number(a.startingPrice || 0).toLocaleString()} ل.س</Text>
                                                            <Text style={{ color: '#6B7280', marginTop: 4, fontSize: 12 }}>يغلق: {formatDateShort(a.endTime)}</Text>
                                                            <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
                                                                <Pressable onPress={() => router.push(`/auctions/${a.auctionId}` as any)} style={{ backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}>
                                                                    <Text style={{ color: 'white', fontWeight: '700' }}>تفاصيل</Text>
                                                                </Pressable>
                                                                <Pressable onPress={() => router.push(`/auctions/edit/${a.auctionId}` as any)} style={{ backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}>
                                                                    <Text style={{ color: 'white', fontWeight: '700' }}>تعديل</Text>
                                                                </Pressable>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>
                                            ))
                                        )}
                                    </>
                                )}

                                {activeTab === 'listings' && (
                                    <>
                                        {myListings.length === 0 ? (
                                            <EmptyState icon="pricetag-outline" title="لا توجد منتجات" subtitle="أنشئ عرض بيع مباشر من صفحة البيع المباشر" />
                                        ) : (
                                            myListings.map((l: any) => (
                                                <CardRow
                                                    key={String(l.listingId)}
                                                    title={l.title || l.cropName || 'منتج' }
                                                    subtitle={`الكمية: ${(l.availableQty || 0).toLocaleString()} ${l.unit || ''}`}
                                                    meta={`السعر: ${(l.unitPrice || 0).toLocaleString()} ل.س`}
                                                    right={l.status || ''}
                                                    icon="pricetag-outline"
                                                />
                                            ))
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </View>
                </View>
            )}

            <Button title="Logout" onPress={onLogout} />
        </ScrollView>
    );
}


// Helpers & small UI pieces (kept here for simplicity)
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
    <View style={{ backgroundColor: `${color}20`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
        <Text style={{ color, fontWeight: '700', fontSize: 12 }}>{label}</Text>
    </View>
);

const CardRow: React.FC<{
    title: string;
    subtitle?: string;
    meta?: string;
    right?: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress?: () => void;
}> = ({ title, subtitle, meta, right, icon, onPress }) => (
    <Pressable onPress={onPress} style={{ marginBottom: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: 'white', padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={icon} size={18} color="#059669" />
            </View>
            <View style={{ flex: 1, marginHorizontal: 10 }}>
                <Text style={{ fontWeight: '700' }} numberOfLines={1}>{title}</Text>
                {subtitle ? <Text style={{ color: '#6B7280', marginTop: 2 }} numberOfLines={2}>{subtitle}</Text> : null}
                {meta ? <Text style={{ color: '#059669', marginTop: 6, fontWeight: '700' }}>{meta}</Text> : null}
            </View>
            {right ? <Text style={{ color: '#6B7280', fontSize: 12, marginLeft: 8 }}>{right}</Text> : null}
        </View>
    </Pressable>
);

const EmptyState: React.FC<{ icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
    <View style={{ alignItems: 'center', paddingVertical: 24 }}>
        <View style={{ width: 72, height: 72, borderRadius: 999, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D1FAE5' }}>
            <Ionicons name={icon} size={28} color="#059669" />
        </View>
        <Text style={{ marginTop: 10, fontWeight: '800', fontSize: 16 }}>{title}</Text>
        {subtitle ? <Text style={{ marginTop: 4, color: '#6B7280', textAlign: 'center' }}>{subtitle}</Text> : null}
    </View>
);


