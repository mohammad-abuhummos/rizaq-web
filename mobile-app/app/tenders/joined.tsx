import { getMyProfile } from '@/services/auth';
import { listJoinedTendersByUser } from '@/services/tender';
import type { Tender } from '@/types/tender';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

export default function JoinedTendersScreen() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [tenders, setTenders] = useState<Tender[]>([]);

    const load = useCallback(async (isRefresh = false) => {
        try {
            setError(null);
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const profile = await getMyProfile();
            const userId = (profile as any)?.userId;
            if (!userId) throw new Error(t('error_user_not_found', 'تعذر تحديد المستخدم'));

            const res = await listJoinedTendersByUser(Number(userId));
            const data = (res as any)?.data ?? (res as any);
            setTenders(Array.isArray(data) ? (data as Tender[]) : []);
        } catch (e: any) {
            setError(e?.message || t('error_loading_joined_tenders', 'فشل تحميل المناقصات المنضم إليها'));
            setTenders([]);
        } finally {
            if (isRefresh) setRefreshing(false);
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        load();
    }, [load]);

    const title = useMemo(() => t('joined_tenders', 'المناقصات المنضم إليها'), [t]);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View className="flex-1 bg-gray-50">
                {/* Header */}
                <View className="px-5 pt-14 pb-6 bg-white border-b border-gray-100">
                    <View className="flex-row items-center justify-between">
                        <Pressable onPress={() => router.back()} className="p-2 rounded-full bg-gray-100" hitSlop={8}>
                            <Ionicons name="arrow-forward" size={22} color="#111827" />
                        </Pressable>
                        <Text className="flex-1 mr-3 text-2xl text-right text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>
                            {title}
                        </Text>
                    </View>
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={["#059669"]} tintColor="#059669" />}
                >
                    {loading ? (
                        <View className="items-center justify-center py-16">
                            <ActivityIndicator size="large" color="#059669" />
                            <Text className="mt-3 text-sm text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>
                                {t('loading_joined_tenders', 'جاري تحميل المناقصات...')}
                            </Text>
                        </View>
                    ) : error ? (
                        <View className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
                            <Text className="text-center text-red-700" style={{ fontFamily: 'Cairo-Regular' }}>
                                {error}
                            </Text>
                            <Pressable onPress={() => load()} className="mt-3 self-end px-4 py-2 bg-red-500 rounded-xl active:bg-red-600">
                                <Text className="text-xs text-white" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                    {t('retry', 'إعادة المحاولة')}
                                </Text>
                            </Pressable>
                        </View>
                    ) : tenders.length === 0 ? (
                        <View className="items-center justify-center py-16">
                            <View className="w-20 h-20 items-center justify-center rounded-full bg-amber-50 border border-amber-200">
                                <Ionicons name="document-text-outline" size={36} color="#B45309" />
                            </View>
                            <Text className="mt-4 text-lg text-gray-800" style={{ fontFamily: 'Cairo-Bold' }}>
                                {t('no_joined_tenders', 'لم تنضم إلى أي مناقصات بعد')}
                            </Text>
                            <Text className="mt-2 text-sm text-gray-500 text-center" style={{ fontFamily: 'Cairo-Regular' }}>
                                {t('no_joined_tenders_hint', 'استكشف المناقصات المفتوحة وانضم إليها لعرضها هنا')}
                            </Text>
                        </View>
                    ) : (
                        <View>
                            {tenders.map((item) => {
                                const id = (item as any).tenderId || (item as any).id;
                                return (
                                    <View key={String(id)} className="p-4 mb-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                        <View className="flex-row justify-between items-start">
                                            <View className="flex-1 ml-3">
                                                <Text className="text-lg text-gray-900" style={{ fontFamily: 'Cairo-Bold' }} numberOfLines={2}>
                                                    {item.title || item.cropName || t('tender', 'مناقصة')}
                                                </Text>
                                                {item.deliveryLocation ? (
                                                    <Text className="mt-1 text-sm text-gray-500" style={{ fontFamily: 'Cairo-Regular' }} numberOfLines={1}>
                                                        {item.deliveryLocation}
                                                    </Text>
                                                ) : null}
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-xs text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>{t('quantity', 'الكمية')}</Text>
                                                <Text className="text-sm text-gray-800" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                                    {(item.quantity ?? '-') + (item.unit ? ` ${item.unit}` : '')}
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="flex-row justify-between items-center mt-4">
                                            <View className="flex-row items-center">
                                                <Ionicons name="cash-outline" size={16} color="#16A34A" />
                                                <Text className="mr-2 text-sm text-gray-800" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                                    {t('max_budget', 'الميزانية القصوى')}: {item.maxBudget ?? '-'}
                                                </Text>
                                            </View>
                                            <Pressable
                                                onPress={() => router.push({ pathname: '/tenders/[id]', params: { id: String(id) } })}
                                                className="px-4 py-2 bg-emerald-600 rounded-xl active:bg-emerald-700"
                                            >
                                                <Text className="text-white text-sm" style={{ fontFamily: 'Cairo-SemiBold' }}>
                                                    {t('details', 'التفاصيل')}
                                                </Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            </View>
        </>
    );
}



