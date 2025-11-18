import { getMyProfile } from '@/services/auth';
import { listJoinedAuctionsByUser } from '@/services/auction';
import { getCropById } from '@/services/crop';
import type { OpenAuction } from '@/types/auction';
import type { CropDetail } from '@/types/crop';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

export default function JoinedAuctionsScreen() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [auctions, setAuctions] = useState<OpenAuction[]>([]);
  const [crops, setCrops] = useState<Record<number, CropDetail | undefined>>({});

  const isEnglish = (i18n?.language || '').startsWith('en');

  const load = useCallback(async (isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) setRefreshing(true); else setLoading(true);

      const profile = await getMyProfile();
      const userId = (profile as any)?.userId;
      if (!userId) throw new Error(t('error_user_not_found', 'تعذر تحديد المستخدم'));

      const res = await listJoinedAuctionsByUser(Number(userId));
      const data = (res as any)?.data ?? (res as any);
      const list: OpenAuction[] = Array.isArray(data) ? data : [];
      setAuctions(list);

      // Load crop details in background
      const uniqueCropIds = Array.from(new Set(list.map(a => a.cropId).filter(Boolean)));
      if (uniqueCropIds.length) {
        const results = await Promise.allSettled(uniqueCropIds.map(id => getCropById(Number(id))));
        const map: Record<number, CropDetail | undefined> = {};
        results.forEach((r, idx) => {
          const id = uniqueCropIds[idx];
          if (r.status === 'fulfilled') {
            const payload = (r.value as any)?.data ?? r.value;
            map[id] = payload as CropDetail;
          } else {
            map[id] = undefined;
          }
        });
        setCrops(map);
      } else {
        setCrops({});
      }
    } catch (e: any) {
      setError(e?.message || t('error_loading_joined_auctions', 'فشل تحميل المزادات المنضم إليها'));
      setAuctions([]);
      setCrops({});
    } finally {
      if (isRefresh) setRefreshing(false);
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const title = useMemo(() => t('joined_auctions', 'المزادات المنضم إليها'), [t]);

  const formatDateTime = (value?: string | null) => {
    if (!value) return isEnglish ? 'N/A' : 'غير متوفر';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return isEnglish ? 'N/A' : 'غير متوفر';
    try {
      return d.toLocaleString(isEnglish ? 'en-US' : 'ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return d.toLocaleString();
    }
  };

  const statusLabel = (s?: string | null) => {
    const key = String(s || '').toLowerCase();
    const ar: Record<string, string> = { open: 'مفتوح', closed: 'مغلق', pending: 'قيد الانتظار' };
    const en: Record<string, string> = { open: 'Open', closed: 'Closed', pending: 'Pending' };
    return (isEnglish ? en[key] : ar[key]) || (isEnglish ? 'Unknown' : 'غير معروف');
  };

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
                {t('loading_joined_auctions', 'جاري تحميل المزادات...')}
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
          ) : auctions.length === 0 ? (
            <View className="items-center justify-center py-16">
              <View className="w-20 h-20 items-center justify-center rounded-full bg-amber-50 border border-amber-200">
                <Ionicons name="hammer-outline" size={36} color="#B45309" />
              </View>
              <Text className="mt-4 text-lg text-gray-800" style={{ fontFamily: 'Cairo-Bold' }}>
                {t('no_joined_auctions', 'لم تنضم إلى أي مزادات بعد')}
              </Text>
              <Text className="mt-2 text-sm text-gray-500 text-center" style={{ fontFamily: 'Cairo-Regular' }}>
                {t('no_joined_auctions_hint', 'استكشف المزادات المفتوحة وانضم إليها لعرضها هنا')}
              </Text>
            </View>
          ) : (
            <View>
              {auctions.map((a) => {
                const crop = crops[a.cropId];
                return (
                  <View key={String(a.auctionId)} className="p-4 mb-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 ml-3">
                        <Text className="text-lg text-gray-900" style={{ fontFamily: 'Cairo-Bold' }} numberOfLines={2}>
                          {a.auctionTitle || (isEnglish ? 'Auction' : 'مزاد')}
                        </Text>
                        <Text className="mt-1 text-xs text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>
                          {statusLabel(a.status)} • {formatDateTime(a.startTime)} → {formatDateTime(a.endTime)}
                        </Text>
                        {crop && (
                          <Text className="mt-2 text-sm text-gray-700" style={{ fontFamily: 'Cairo-SemiBold' }} numberOfLines={2}>
                            {(isEnglish ? 'Crop' : 'المحصول')}: {crop.name} {crop.variety ? `• ${crop.variety}` : ''} {crop.quantity ? `• ${crop.quantity} ${crop.unit || ''}` : ''}
                          </Text>
                        )}
                      </View>
                      {crop?.images?.length ? (
                        <Image source={{ uri: crop.images[0] }} style={{ width: 64, height: 64, borderRadius: 12 }} />
                      ) : null}
                    </View>

                    <View className="flex-row justify-between items-center mt-4">
                      <View className="flex-row items-center">
                        <Ionicons name="cash-outline" size={16} color="#16A34A" />
                        <Text className="mr-2 text-sm text-gray-800" style={{ fontFamily: 'Cairo-SemiBold' }}>
                          {(isEnglish ? 'Current' : 'السعر الحالي')}: {a.currentPrice ?? '-'}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="swap-vertical-outline" size={16} color="#4B5563" />
                        <Text className="mr-2 text-sm text-gray-600" style={{ fontFamily: 'Cairo-Regular' }}>
                          {(isEnglish ? 'Min Increment' : 'الزيادة الدنيا')}: {a.minIncrement}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row justify-end mt-4">
                      <Pressable
                        onPress={() => router.push({ pathname: '/auctions/[id]', params: { id: String(a.auctionId) } })}
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


