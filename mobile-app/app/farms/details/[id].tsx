import { getFarmById } from '@/services/farm';
import type { Farm } from '@/types/farm';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DetailRowProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string | number | null;
    isLast?: boolean;
}

const DetailRow = ({ icon, label, value, isLast }: DetailRowProps) => (
    <View className={`flex-row items-center justify-between py-3 ${isLast ? '' : 'border-b border-gray-100'}`}>
        <View className="flex-row items-center flex-1">
            <Ionicons name={icon} size={18} color="#059669" />
            <Text className="mr-2 text-gray-600 text-base" style={{ fontFamily: 'Cairo-Regular' }}>
                {label}
            </Text>
        </View>
        <Text className="ml-4 text-gray-900 text-base" style={{ fontFamily: 'Cairo-SemiBold' }}>
            {value === null || value === undefined || value === '' ? '—' : value}
        </Text>
    </View>
);

const SectionCard = ({ title, children }: { title: string; children: ReactNode }) => (
    <View className="mb-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Text className="mb-4 text-lg text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>
            {title}
        </Text>
        {children}
    </View>
);

export default function FarmDetailsScreen() {
    const { id } = useLocalSearchParams();
    const farmId = Number(id);

    const [farm, setFarm] = useState<Farm | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadFarm = useCallback(async () => {
        if (!farmId) {
            setError('معرف المزرعة غير صالح');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await getFarmById(farmId);
            const data = (res as any)?.data ?? res;
            setFarm(data);
        } catch (e: any) {
            setError(e?.message || 'فشل في تحميل تفاصيل المزرعة');
        } finally {
            setLoading(false);
        }
    }, [farmId]);

    useEffect(() => {
        loadFarm();
    }, [loadFarm]);

    const locationSummary = useMemo(() => {
        if (!farm) return '—';
        const parts = [farm.city, farm.governorate, farm.country].filter(Boolean);
        return parts.length ? parts.join('، ') : '—';
    }, [farm]);

    const formattedDate = useMemo(() => {
        if (!farm?.createdAt) return '—';
        const date = new Date(farm.createdAt);
        return isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
    }, [farm?.createdAt]);

    const renderStatusPills = () => {
        if (!farm) return null;
        return (
            <View className="flex-row flex-wrap gap-2 mb-4">
                <View className={`px-3 py-1 rounded-full ${farm.isActive ? 'bg-green-50' : 'bg-red-50'}`}>
                    <Text
                        className={`${farm.isActive ? 'text-green-700' : 'text-red-700'} text-sm`}
                        style={{ fontFamily: 'Cairo-SemiBold' }}
                    >
                        {farm.isActive ? 'الحالة: نشطة' : 'الحالة: غير نشطة'}
                    </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${farm.canStoreAfterHarvest ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                    <Text
                        className={`${farm.canStoreAfterHarvest ? 'text-emerald-700' : 'text-orange-700'} text-sm`}
                        style={{ fontFamily: 'Cairo-SemiBold' }}
                    >
                        {farm.canStoreAfterHarvest ? 'التخزين متاح' : 'التخزين غير متاح'}
                    </Text>
                </View>
            </View>
        );
    };

    const renderBody = () => {
        if (loading) {
            return (
                <View className="flex-1 justify-center items-center py-20">
                    <ActivityIndicator size="large" color="#059669" />
                    <Text className="mt-4 text-gray-600" style={{ fontFamily: 'Cairo-Regular' }}>
                        جاري تحميل التفاصيل...
                    </Text>
                </View>
            );
        }

        if (error) {
            return (
                <View className="p-5 mt-6 mx-4 bg-red-50 border border-red-200 rounded-2xl">
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="alert-circle" size={22} color="#DC2626" />
                        <Text className="flex-1 mr-2 text-red-700" style={{ fontFamily: 'Cairo-Regular' }}>
                            {error}
                        </Text>
                    </View>
                    <Pressable
                        onPress={loadFarm}
                        className="flex-row justify-center items-center py-3 bg-red-600 rounded-xl active:bg-red-700"
                    >
                        <Ionicons name="refresh" size={20} color="#fff" />
                        <Text className="mr-2 text-base text-white" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            إعادة المحاولة
                        </Text>
                    </Pressable>
                </View>
            );
        }

        if (!farm) {
            return null;
        }

        return (
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                {renderStatusPills()}

                <SectionCard title="معلومات عامة">
                    <DetailRow icon="pricetag" label="معرف المزرعة" value={`#${farm.farmId}`} />
                    <DetailRow icon="leaf" label="اسم المزرعة" value={farm.name} />
                    <DetailRow icon="business" label="نوع الملكية" value={farm.landOwnershipType} />
                    <DetailRow icon="grid" label="المساحة" value={farm.area} />
                    <DetailRow icon="person" label="معرف المزارع" value={`#${farm.farmerId}`} isLast />
                </SectionCard>

                <SectionCard title="الموقع">
                    <DetailRow icon="compass" label="الوصف المختصر" value={locationSummary} />
                    <DetailRow icon="flag" label="الدولة" value={farm.country} />
                    <DetailRow icon="navigate" label="المحافظة" value={farm.governorate} />
                    <DetailRow icon="pin" label="المدينة" value={farm.city} />
                    <DetailRow icon="home" label="القرية" value={farm.village} />
                    <DetailRow icon="map" label="الشارع" value={farm.street} isLast />
                </SectionCard>

                <SectionCard title="إحداثيات وتواريخ">
                    <DetailRow icon="locate" label="خط العرض" value={farm.latitude} />
                    <DetailRow icon="locate-outline" label="خط الطول" value={farm.longitude} />
                    <DetailRow icon="calendar" label="تاريخ الإنشاء" value={formattedDate} />
                    <DetailRow icon="checkmark-circle" label="حالة التفعيل" value={farm.isActive ? 'مفعلة' : 'غير مفعلة'} />
                    <DetailRow
                        icon="cube"
                        label="التخزين بعد الحصاد"
                        value={farm.canStoreAfterHarvest ? 'متاح' : 'غير متاح'}
                        isLast
                    />
                </SectionCard>
            </ScrollView>
        );
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top', 'bottom']}>
                <View className="px-5 pt-6 pb-4 bg-white border-b border-gray-100 shadow-sm">
                    <View className="flex-row items-center justify-between mb-4">
                        <Pressable
                            onPress={() => router.back()}
                            className="w-11 h-11 rounded-full bg-gray-100 justify-center items-center"
                        >
                            <Ionicons name="arrow-forward" size={22} color="#111827" />
                        </Pressable>
                        <Pressable
                            onPress={loadFarm}
                            className="px-4 py-2 rounded-full bg-gray-100 flex-row items-center active:bg-gray-200"
                        >
                            <Ionicons name="refresh" size={18} color="#374151" />
                            <Text className="mr-2 text-sm text-gray-700" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                تحديث
                            </Text>
                        </Pressable>
                    </View>
                    <Text className="text-2xl text-gray-900 mb-1" style={{ fontFamily: 'Cairo-Bold' }}>
                        تفاصيل المزرعة
                    </Text>
                    <Text className="text-base text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>
                        {farm?.name || 'اطلع على جميع بيانات المزرعة'}
                    </Text>
                </View>
                {renderBody()}
            </SafeAreaView>
        </>
    );
}


