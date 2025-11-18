import { listDirectListings } from '@/services/direct';
import type { DirectListing } from '@/types/direct';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

export default function DirectListingsScreen() {
    const [listings, setListings] = useState<DirectListing[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const loadListings = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listDirectListings();
            const data = (res as any)?.data ?? res;
            setListings(data || []);
        } catch (e: any) {
            setError(e?.message || 'فشل في تحميل القوائم');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadListings();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadListings();
    };

    const renderItem = ({ item }: { item: DirectListing }) => (
        <View className="p-5 mb-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            {/* Title and Location */}
            <View className="mb-4">
                <Text className="mb-2 text-xl text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>
                    {item.title || item.cropName || 'قائمة'}
                </Text>
                {item.location && (
                    <View className="flex-row items-center">
                        <Ionicons name="location" size={16} color="#6B7280" />
                        <Text className="mr-1 text-sm text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>
                            {item.location}
                        </Text>
                    </View>
                )}
            </View>

            {/* Price and Quantity Info */}
            <View className="p-4 mb-4 bg-gray-50 rounded-xl">
                <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center">
                        <View className="justify-center items-center ml-3 w-10 h-10 bg-green-100 rounded-full">
                            <Ionicons name="pricetag" size={20} color="#16A34A" />
                        </View>
                        <View>
                            <Text className="mb-1 text-xs text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>
                                السعر للوحدة
                            </Text>
                            <Text className="text-lg text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>
                                {item.unitPrice} / {item.unit || '-'}
                            </Text>
                        </View>
                    </View>
                    <View className="items-end">
                        <Text className="mb-1 text-xs text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>
                            الكمية المتاحة
                        </Text>
                        <Text className="text-lg text-green-600" style={{ fontFamily: 'Cairo-Bold' }}>
                            {item.availableQty}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Action Buttons */}
            <Pressable
                onPress={() => router.push({ pathname: '/direct/buy', params: { id: String(item.listingId) } })}
                className="bg-green-600 py-3.5 rounded-xl active:bg-green-700 flex-row items-center justify-center"
            >
                <Ionicons name="cart" size={22} color="white" />
                <Text className="mr-2 text-lg text-white" style={{ fontFamily: 'Cairo-SemiBold' }}>
                    شراء الآن
                </Text>
            </Pressable>
        </View>
    );

    const renderEmptyState = () => (
        <View className="justify-center items-center py-20">
            <View className="justify-center items-center mb-4 w-24 h-24 bg-gray-100 rounded-full">
                <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
            </View>
            <Text className="mb-2 text-xl text-center text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>
                لا توجد قوائم متاحة
            </Text>
            <Text className="text-center text-gray-500" style={{ fontFamily: 'Cairo-Regular' }}>
                ابدأ بإنشاء قائمة جديدة للبيع المباشر
            </Text>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="px-5 pt-14 pb-6 bg-white border-b border-gray-100">
                <Text className="mb-4 text-2xl text-center text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>
                    البيع المباشر
                </Text>

                {/* Action Buttons */}
                <View className="flex-row gap-3">
                    <Pressable
                        onPress={() => router.push('/direct/new')}
                        className="flex-row flex-1 justify-center items-center py-3 bg-green-600 rounded-xl active:bg-green-700"
                    >
                        <Ionicons name="add-circle" size={20} color="white" />
                        <Text className="mr-2 text-base text-white" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            قائمة جديدة
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => router.push('/direct/orders')}
                        className="flex-row flex-1 justify-center items-center py-3 bg-gray-800 rounded-xl active:bg-gray-900"
                    >
                        <Ionicons name="receipt" size={20} color="white" />
                        <Text className="mr-2 text-base text-white" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            طلباتي
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Loading Indicator */}
            {loading && !refreshing && (
                <View className="flex-row items-center p-4 mx-4 mt-4 bg-blue-50 rounded-xl border border-blue-200">
                    <ActivityIndicator size="small" color="#2563EB" />
                    <Text className="mr-3 text-blue-700" style={{ fontFamily: 'Cairo-Regular' }}>
                        جاري تحميل القوائم...
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

            {/* Listings */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16A34A']} />
                }
            >
                {!loading && listings.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <FlatList
                        data={listings}
                        keyExtractor={(x) => String(x.listingId)}
                        renderItem={renderItem}
                        scrollEnabled={false}
                    />
                )}
            </ScrollView>
        </View>
    );
}


