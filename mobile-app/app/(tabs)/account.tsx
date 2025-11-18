import { listAuctionsCreatedByUser, listJoinedAuctionsByUser } from '@/services/auction';
import { getCurrentUserType, getMyProfile } from '@/services/auth';
import { listDirectListings } from '@/services/direct';
import { listJoinedTendersByUser, listTendersCreatedByUser } from '@/services/tender';
import { clearAuth, getAuthToken } from '@/storage/auth-storage';
import type { ProfileMe, UserTypeInfo } from '@/types/profile';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

export default function AccountScreen() {
    const { t } = useTranslation();
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [profile, setProfile] = useState<ProfileMe | null>(null);
    const [userType, setUserType] = useState<UserTypeInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [joinedTendersCount, setJoinedTendersCount] = useState<number>(0);
    const [joinedAuctionsCount, setJoinedAuctionsCount] = useState<number>(0);

    // نشاطاتي state
    const [showCenter, setShowCenter] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'tenders' | 'auctions' | 'listings'>('tenders');
    const [myTenders, setMyTenders] = useState<any[]>([]);
    const [myAuctions, setMyAuctions] = useState<any[]>([]);
    const [myListings, setMyListings] = useState<any[]>([]);
    const [loadingTabs, setLoadingTabs] = useState<boolean>(false);
    const [tabsError, setTabsError] = useState<string | null>(null);

    const loadProfileData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [profileData, userTypeData] = await Promise.all([
                getMyProfile(),
                getCurrentUserType()
            ]);
            setProfile(profileData);
            setUserType(userTypeData);
        } catch (e: any) {
            setError(e?.message || 'فشل تحميل بيانات الحساب');
        } finally {
            setLoading(false);
        }
    }, []);

    const checkAuthStatus = useCallback(async () => {
        const token = await getAuthToken();
        setIsLoggedIn(!!token);

        if (token) {
            await loadProfileData();
        }
    }, [loadProfileData]);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    // Load joined tenders count once profile is available
    useEffect(() => {
        const loadJoined = async () => {
            try {
                if (!profile?.userId) return;
                const res = await listJoinedTendersByUser(profile.userId as number);
                const data = (res as any)?.data ?? (res as any);
                const count = Array.isArray(data) ? data.length : 0;
                setJoinedTendersCount(count);
            } catch {
                setJoinedTendersCount(0);
            }
        };
        loadJoined();
    }, [profile?.userId]);

    // Load joined auctions count
    useEffect(() => {
        const loadJoinedAuctions = async () => {
            try {
                if (!profile?.userId) return;
                const res = await listJoinedAuctionsByUser(profile.userId as number);
                const data = (res as any)?.data ?? (res as any);
                const count = Array.isArray(data) ? data.length : 0;
                setJoinedAuctionsCount(count);
            } catch {
                setJoinedAuctionsCount(0);
            }
        };
        loadJoinedAuctions();
    }, [profile?.userId]);

    const handleLogout = async () => {
        Alert.alert(
            'تسجيل الخروج',
            'هل أنت متأكد من تسجيل الخروج؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'تسجيل الخروج',
                    style: 'destructive',
                    onPress: async () => {
                        await clearAuth();
                        setIsLoggedIn(false);
                        setProfile(null);
                        setUserType(null);
                        router.replace('/intro');
                    }
                }
            ]
        );
    };

    const loadMyCenter = useCallback(async (target?: 'tenders' | 'auctions' | 'listings') => {
        if (!profile?.userId) return;
        setLoadingTabs(true);
        setTabsError(null);
        try {
            const [tendersRes, auctionsRes, listingsRes] = await Promise.all([
                listTendersCreatedByUser(profile.userId).catch(() => ({ data: [] } as any)),
                listAuctionsCreatedByUser(profile.userId).catch(() => ({ data: [] } as any)),
                listDirectListings().catch(() => ({ data: [] } as any)),
            ]);
            const t = (tendersRes as any)?.data ?? tendersRes;
            const a = (auctionsRes as any)?.data ?? auctionsRes;
            const l = (listingsRes as any)?.data ?? listingsRes;
            setMyTenders(Array.isArray(t) ? t : []);
            setMyAuctions(Array.isArray(a) ? a : []);
            const filteredListings = (Array.isArray(l) ? l : []).filter((x: any) => String(x?.sellerUserId || '') === String(profile.userId));
            setMyListings(filteredListings);
            if (target) setActiveTab(target);
        } catch (e: any) {
            setTabsError(e?.message || 'تعذر تحميل بيانات نشاطاتي');
        } finally {
            setLoadingTabs(false);
        }
    }, [profile?.userId]);

    // Loading state
    if (isLoggedIn === null) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Text className="text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>
                    جاري التحميل...
                </Text>
            </View>
        );
    }

    // Not logged in
    if (!isLoggedIn) {
        return (
            <ScrollView className="flex-1 bg-white">
                {/* Header */}
                <View className="px-5 pt-14 pb-6 bg-white border-b border-gray-100">
                    <Text className="text-2xl font-bold text-center text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>
                        الحساب
                    </Text>
                </View>

                {/* Not Logged In State */}
                <View className="flex-1 justify-center items-center px-8 py-20">
                    {/* Icon Container */}
                    <View className="justify-center items-center mb-6 w-32 h-32 bg-gray-50 rounded-full">
                        <View className="justify-center items-center w-24 h-24 bg-gray-100 rounded-full">
                            <Ionicons name="person-outline" size={56} color="#9CA3AF" />
                        </View>
                    </View>

                    {/* Title */}
                    <Text
                        className="mb-3 text-2xl text-center text-gray-900"
                        style={{ fontFamily: 'Cairo-Bold' }}
                    >
                        يجب تسجيل الدخول
                    </Text>

                    {/* Description */}
                    <Text
                        className="mb-8 text-base leading-6 text-center text-gray-500"
                        style={{ fontFamily: 'Cairo-Regular' }}
                    >
                        للوصول إلى حسابك ومعلوماتك الشخصية،{'\n'}يرجى تسجيل الدخول أولاً
                    </Text>

                    {/* Login Button */}
                    <Pressable
                        onPress={() => router.push('/login')}
                        className="px-8 py-4 bg-green-600 rounded-xl shadow-sm active:bg-green-700"
                    >
                        <Text
                            className="text-lg text-center text-white"
                            style={{ fontFamily: 'Cairo-SemiBold' }}
                        >
                            تسجيل الدخول
                        </Text>
                    </Pressable>

                    {/* Register Link */}
                    <View className="flex-row items-center mt-6">
                        <Text
                            className="text-base text-gray-600"
                            style={{ fontFamily: 'Cairo-Regular' }}
                        >
                            ليس لديك حساب؟{' '}
                        </Text>
                        <Pressable onPress={() => router.push('/registration')}>
                            <Text
                                className="text-base text-green-600"
                                style={{ fontFamily: 'Cairo-SemiBold' }}
                            >
                                إنشاء حساب جديد
                            </Text>
                        </Pressable>
                    </View>

                    {/* Decorative Elements */}
                    <View className="flex-row gap-2 mt-10">
                        <View className="w-2 h-2 bg-gray-200 rounded-full" />
                        <View className="w-2 h-2 bg-gray-300 rounded-full" />
                        <View className="w-2 h-2 bg-gray-200 rounded-full" />
                    </View>
                </View>
            </ScrollView>
        );
    }

    // Logged in - show account info
    const displayName = profile?.fullName || 'مستخدم';
    const firstLetter = displayName.trim().charAt(0).toUpperCase();

    return (
        <ScrollView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="px-5 pt-14 pb-6 bg-white border-b border-gray-100">
                <Text className="text-2xl font-bold text-center text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>
                    الحساب
                </Text>
            </View>

            {/* Profile Header Card */}
            <View className="p-6 mx-4 mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <View className="items-center">
                    {/* Avatar */}
                    <View className="justify-center items-center mb-4 w-24 h-24 bg-green-100 rounded-full border-4 border-green-50">
                        <Text className="text-3xl font-bold text-green-700" style={{ fontFamily: 'Cairo-Bold' }}>
                            {firstLetter}
                        </Text>
                    </View>

                    {/* Name */}
                    <Text className="mb-2 text-2xl text-center text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>
                        {displayName}
                    </Text>

                    {/* Role Badge */}
                    {userType?.description && (
                        <View className="px-4 py-2 bg-green-50 rounded-full border border-green-200">
                            <Text className="text-sm text-green-700" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                {userType.description}
                            </Text>
                        </View>
                    )}

                    {/* User ID */}
                    {profile?.userId && (
                        <Text className="mt-2 text-sm text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>
                            المعرف: {profile.userId}
                        </Text>
                    )}
                </View>
            </View>

            {/* Loading Indicator */}
            {loading && (
                <View className="flex-row items-center p-4 mx-4 mt-4 bg-blue-50 rounded-xl border border-blue-200">
                    <ActivityIndicator size="small" color="#2563EB" />
                    <Text className="mr-3 text-blue-700" style={{ fontFamily: 'Cairo-Regular' }}>
                        جاري تحميل البيانات...
                    </Text>
                </View>
            )}

            {/* Error Message */}
            {error && (
                <View className="p-4 mx-4 mt-4 bg-red-50 rounded-xl border border-red-200">
                    <Text className="text-center text-red-700" style={{ fontFamily: 'Cairo-Regular' }}>
                        {error}
                    </Text>
                </View>
            )}

            {/* Contact Information Card */}
            {profile && (
                <View className="p-5 mx-4 mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <Text className="mb-4 text-lg text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>
                        معلومات الاتصال
                    </Text>

                    {/* Email */}
                    {profile.email && (
                        <View className="flex-row items-center p-4 mb-4 bg-gray-50 rounded-xl">
                            <View className="justify-center items-center ml-3 w-10 h-10 bg-blue-100 rounded-full">
                                <Ionicons name="mail" size={20} color="#2563EB" />
                            </View>
                            <View className="flex-1">
                                <Text className="mb-1 text-xs text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>
                                    البريد الإلكتروني
                                </Text>
                                <Text className="text-base text-gray-900" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                    {profile.email}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Phone */}
                    {profile.phone && (
                        <View className="flex-row items-center p-4 bg-gray-50 rounded-xl">
                            <View className="justify-center items-center ml-3 w-10 h-10 bg-green-100 rounded-full">
                                <Ionicons name="call" size={20} color="#16A34A" />
                            </View>
                            <View className="flex-1">
                                <Text className="mb-1 text-xs text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>
                                    رقم الهاتف
                                </Text>
                                <Text className="text-base text-gray-900" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                    {profile.phone}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            )}

            {/* نشاطاتي button navigates to dedicated page */}
            {profile && (
                <View className="mx-4 mt-4">
                    <Pressable
                        onPress={() => router.push('/my-activity' as any)}
                        className="flex-row justify-center items-center py-4 bg-emerald-600 rounded-xl shadow-sm active:bg-emerald-700"
                    >
                        <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
                        <Text className="mr-2 text-lg text-white" style={{ fontFamily: 'Cairo-Bold' }}>
                            نشاطاتي
                        </Text>
                    </Pressable>
                </View>
            )}

            {/* My Orders Button */}
            {profile && (
                <View className="mx-4 mt-4">
                    <Pressable
                        onPress={() => router.push('/direct/orders' as any)}
                        className="flex-row justify-center items-center py-4 bg-gray-800 rounded-xl shadow-sm active:bg-gray-900"
                    >
                        <Ionicons name="receipt" size={22} color="white" />
                        <Text className="mr-2 text-lg text-white" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            طلباتي
                        </Text>
                    </Pressable>
                </View>
            )}

            {/* Joined Tenders */}
            {profile && (
                <View className="mx-4 mt-4">
                    <Pressable
                        onPress={() => router.push('/tenders/joined' as any)}
                        className="flex-row justify-between items-center py-4 px-4 bg-white rounded-xl border border-gray-200 active:bg-gray-50"
                    >
                        <View className="flex-row items-center">
                            <View className="justify-center items-center ml-3 w-10 h-10 bg-emerald-100 rounded-full">
                                <Ionicons name="document-text-outline" size={20} color="#059669" />
                            </View>
                            <Text className="text-base text-gray-900" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                {t('joined_tenders', 'المناقصات المنضم إليها')}
                            </Text>
                        </View>
                        <View className="flex-row items-center">
                            <View className="justify-center items-center mr-2 min-w-[28px] h-7 px-2 bg-emerald-600 rounded-full">
                                <Text className="text-white text-xs" style={{ fontFamily: 'Cairo-Bold' }}>{joinedTendersCount}</Text>
                            </View>
                            <Ionicons name="chevron-back" size={18} color="#6B7280" />
                        </View>
                    </Pressable>
                </View>
            )}

            {/* Joined Auctions */}
            {profile && (
                <View className="mx-4 mt-4">
                    <Pressable
                        onPress={() => router.push('/auctions/joined' as any)}
                        className="flex-row justify-between items-center py-4 px-4 bg-white rounded-xl border border-gray-200 active:bg-gray-50"
                    >
                        <View className="flex-row items-center">
                            <View className="justify-center items-center ml-3 w-10 h-10 bg-amber-100 rounded-full">
                                <Ionicons name="hammer-outline" size={20} color="#B45309" />
                            </View>
                            <Text className="text-base text-gray-900" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                {t('joined_auctions', 'المزادات المنضم إليها')}
                            </Text>
                        </View>
                        <View className="flex-row items-center">
                            <View className="justify-center items-center mr-2 min-w-[28px] h-7 px-2 bg-amber-600 rounded-full">
                                <Text className="text-white text-xs" style={{ fontFamily: 'Cairo-Bold' }}>{joinedAuctionsCount}</Text>
                            </View>
                            <Ionicons name="chevron-back" size={18} color="#6B7280" />
                        </View>
                    </Pressable>
                </View>
            )}

            {/* Manage Farms Button */}
            {profile && (
                <View className="mx-4 mt-4">
                    <Pressable
                        onPress={() => router.push('/farms' as any)}
                        className="flex-row justify-center items-center py-4 bg-green-600 rounded-xl shadow-sm active:bg-green-700"
                    >
                        <Ionicons name="business" size={22} color="white" />
                        <Text className="mr-2 text-lg text-white" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            إدارة مزارعي
                        </Text>
                    </Pressable>
                </View>
            )}

            {/* Logout Button */}
            <View className="mx-4 mt-6 mb-8">
                <Pressable
                    onPress={handleLogout}
                    className="flex-row justify-center items-center py-4 bg-red-500 rounded-xl shadow-sm active:bg-red-600"
                >
                    <Ionicons name="log-out-outline" size={22} color="white" />
                    <Text className="mr-2 text-lg text-white" style={{ fontFamily: 'Cairo-SemiBold' }}>
                        تسجيل الخروج
                    </Text>
                </Pressable>
            </View>
        </ScrollView>
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
            <View className="flex-1 mr-3 items-end">
                <Text className="text-base text-gray-900" style={{ fontFamily: 'Cairo-Bold' }} numberOfLines={1}>{title}</Text>
                {subtitle ? (
                    <Text className="mt-1 text-xs text-gray-500" style={{ fontFamily: 'Cairo-Regular' }} numberOfLines={2}>{subtitle}</Text>
                ) : null}
                {meta ? (
                    <Text className="mt-2 text-emerald-700" style={{ fontFamily: 'Cairo-Bold' }}>{meta}</Text>
                ) : null}
            </View>
            {right ? (
                <Text className="ml-2 text-xs text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>{right}</Text>
            ) : null}
        </View>
    </Pressable>
);

const EmptyState: React.FC<{ icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
    <View className="justify-center items-center py-8">
        <View className="justify-center items-center w-20 h-20 bg-emerald-50 rounded-full border border-emerald-100">
            <Ionicons name={icon} size={28} color="#059669" />
        </View>
        <Text className="mt-3 text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>{title}</Text>
        {subtitle ? (
            <Text className="mt-1 text-center text-sm text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>{subtitle}</Text>
        ) : null}
    </View>
);
