import { deleteFarm, listFarmsByUser } from '@/services/farm';
import { getAuthUser } from '@/storage/auth-storage';
import type { Farm } from '@/types/farm';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

export default function FarmsListScreen() {
    const [farms, setFarms] = useState<Farm[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<number | null>(null);

    const loadFarms = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const u = await getAuthUser<any>();
            const uid = u?.userId || u?.id;
            setUserId(uid);

            if (uid) {
                const res = await listFarmsByUser(uid);
                const data = (res as any)?.data ?? res;
                setFarms(Array.isArray(data) ? data : []);
            }
        } catch (e: any) {
            setError(e?.message || 'فشل في تحميل المزارع');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadFarms();
        }, [loadFarms])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadFarms();
    };

    const handleDelete = (farm: Farm) => {
        Alert.alert(
            'حذف المزرعة',
            `هل أنت متأكد من حذف "${farm.name}"؟`,
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (userId) {
                                await deleteFarm(farm.farmId, userId);
                                Alert.alert('نجح', 'تم حذف المزرعة بنجاح');
                                loadFarms();
                            }
                        } catch (e: any) {
                            Alert.alert('خطأ', e?.message || 'فشل في حذف المزرعة');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Farm }) => (
        <View className="p-5 mb-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            {/* Farm Name */}
            <Text className="mb-2 text-xl text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>
                {item.name}
            </Text>

            {/* Location */}
            {(item.city || item.governorate) && (
                <View className="flex-row items-center mb-3">
                    <Ionicons name="location" size={16} color="#6B7280" />
                    <Text className="mr-1 text-sm text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>
                        {[item.city, item.governorate, item.country].filter(Boolean).join(', ')}
                    </Text>
                </View>
            )}

            {/* Farm Details */}
            <View className="p-3 mb-3 bg-gray-50 rounded-xl">
                {item.area && (
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-gray-600" style={{ fontFamily: 'Cairo-Regular' }}>المساحة</Text>
                        <Text className="text-gray-900" style={{ fontFamily: 'Cairo-SemiBold' }}>{item.area}</Text>
                    </View>
                )}
                <View className="flex-row justify-between">
                    <Text className="text-gray-600" style={{ fontFamily: 'Cairo-Regular' }}>التخزين بعد الحصاد</Text>
                    <Text className={`${item.canStoreAfterHarvest ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Cairo-SemiBold' }}>
                        {item.canStoreAfterHarvest ? 'متاح' : 'غير متاح'}
                    </Text>
                </View>
            </View>

            {/* View Details Button */}
            <Pressable
                onPress={() => router.push(`/farms/details/${item.farmId}`)}
                className="flex-row justify-center items-center py-3 mb-3 bg-emerald-600 rounded-xl active:bg-emerald-700"
            >
                <Ionicons name="eye" size={20} color="white" />
                <Text className="mr-2 text-base text-white" style={{ fontFamily: 'Cairo-SemiBold' }}>
                    عرض التفاصيل
                </Text>
            </Pressable>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
                <Pressable
                    onPress={() => router.push(`/farms/edit/${item.farmId}`)}
                    className="flex-row flex-1 justify-center items-center py-3 bg-blue-600 rounded-xl active:bg-blue-700"
                >
                    <Ionicons name="create" size={20} color="white" />
                    <Text className="mr-2 text-base text-white" style={{ fontFamily: 'Cairo-SemiBold' }}>
                        تعديل
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => handleDelete(item)}
                    className="flex-row flex-1 justify-center items-center py-3 bg-red-600 rounded-xl active:bg-red-700"
                >
                    <Ionicons name="trash" size={20} color="white" />
                    <Text className="mr-2 text-base text-white" style={{ fontFamily: 'Cairo-SemiBold' }}>
                        حذف
                    </Text>
                </Pressable>
            </View>
        </View>
    );

    const renderEmptyState = () => (
        <View className="justify-center items-center py-20">
            <View className="justify-center items-center mb-4 w-24 h-24 bg-gray-100 rounded-full">
                <Ionicons name="business-outline" size={48} color="#9CA3AF" />
            </View>
            <Text className="mb-2 text-xl text-center text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>
                لا توجد مزارع
            </Text>
            <Text className="text-center text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>
                ابدأ بإضافة مزرعتك الأولى
            </Text>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="px-5 pt-14 pb-6 bg-white border-b border-gray-100">
                <Text className="mb-4 text-2xl text-center text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>
                    مزارعي
                </Text>

                {/* Add Farm Button */}
                <Pressable
                    onPress={() => router.push('/farms/create')}
                    className="flex-row justify-center items-center py-3 bg-green-600 rounded-xl active:bg-green-700"
                >
                    <Ionicons name="add-circle" size={20} color="white" />
                    <Text className="mr-2 text-base text-white" style={{ fontFamily: 'Cairo-SemiBold' }}>
                        إضافة مزرعة جديدة
                    </Text>
                </Pressable>
            </View>

            {/* Loading Indicator */}
            {loading && !refreshing && (
                <View className="flex-row items-center p-4 mx-4 mt-4 bg-blue-50 rounded-xl border border-blue-200">
                    <ActivityIndicator size="small" color="#2563EB" />
                    <Text className="mr-3 text-blue-700" style={{ fontFamily: 'Cairo-Regular' }}>
                        جاري تحميل المزارع...
                    </Text>
                </View>
            )}

            {/* Error Message */}
            {error && (
                <View className="p-4 mx-4 mt-4 bg-red-50 rounded-xl border border-red-200">
                    <View className="flex-row items-center">
                        <Ionicons name="alert-circle" size={20} color="#DC2626" />
                        <Text className="flex-1 mr-2 text-red-700" style={{ fontFamily: 'Cairo-Regular' }}>
                            {error}
                        </Text>
                    </View>
                </View>
            )}

            {/* Farms List */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16A34A']} />
                }
            >
                {!loading && farms.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <FlatList
                        data={farms}
                        keyExtractor={(x) => String(x.farmId)}
                        renderItem={renderItem}
                        scrollEnabled={false}
                    />
                )}
            </ScrollView>
        </View>
    );
}

