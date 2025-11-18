import { getRandomTrendSvg } from '@/components/ui/market/TrendSvgs';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface ProductData {
    id: string;
    title: string;
    percentage: string;
    value: string;
    imageUrl: string;
    subtitle?: string;
}

const initialData: ProductData[] = [
    {
        id: '1',
        title: 'تفاح أخضر',
        subtitle: 'الفئة الممتازة',
        percentage: '+9.7%',
        value: '12,460',
        imageUrl:
            'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=300',
    },
    {
        id: '2',
        title: 'بندورة بلدي',
        subtitle: 'الفئة الأولى',
        percentage: '-2.3%',
        value: '1,939',
        imageUrl:
            'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=300',
    },
    {
        id: '3',
        title: 'بقدونس',
        subtitle: 'الفئة الممتازة',
        percentage: '-2.3%',
        value: '2,723',
        imageUrl:
            'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=300',
    },
    {
        id: '4',
        title: 'خس',
        subtitle: 'الفئة الأولى',
        percentage: '-0.9%',
        value: '1,221',
        imageUrl:
            'https://images.pexels.com/photos/1352199/pexels-photo-1352199.jpeg?auto=compress&cs=tinysrgb&w=300',
    },
];

export default function MarketAnalysisScreen() {
    const [products, setProducts] = useState<ProductData[]>(initialData);
    const [trendComponents, setTrendComponents] = useState<{ [key: string]: React.ComponentType }>({});

    // Update trend SVGs when percentage changes
    useEffect(() => {
        const newTrendComponents: { [key: string]: React.ComponentType } = {};
        products.forEach((product) => {
            const isPositive = product.percentage.startsWith('+');
            newTrendComponents[product.id] = getRandomTrendSvg(isPositive);
        });
        setTrendComponents(newTrendComponents);
    }, [products]);

    // Randomly update values
    useEffect(() => {
        const interval = setInterval(() => {
            setProducts((prevProducts) =>
                prevProducts.map((product) => {
                    // Random chance to update (30% chance per interval)
                    if (Math.random() > 0.7) {
                        const currentValue = parseInt(product.value.replace(',', ''));
                        const changePercent = (Math.random() - 0.5) * 20; // -10% to +10%
                        const newValue = Math.floor(currentValue * (1 + changePercent / 100));
                        const formattedValue = newValue.toLocaleString('en-US');

                        const percentChange = ((newValue - currentValue) / currentValue * 100).toFixed(1);
                        const sign = percentChange >= '0' ? '+' : '';

                        return {
                            ...product,
                            value: formattedValue,
                            percentage: `${sign}${percentChange}%`,
                        };
                    }
                    return product;
                })
            );
        }, 2000); // Update every 2 seconds

        return () => clearInterval(interval);
    }, []);

    const renderProductCard = (product: ProductData) => {
        const isPositive = product.percentage.startsWith('+');
        const TrendComponent = trendComponents[product.id];

        return (
            <View key={product.id} className="flex-row items-center bg-[#2d2d2d] rounded-xl p-4 mb-3">
                {/* Right: Image and Product Info */}
                <View className="flex-row items-center flex-1">
                    <Image
                        source={{ uri: product.imageUrl }}
                        style={{ width: 60, height: 60, borderRadius: 8 }}
                        contentFit="cover"
                    />
                    <View className="items-start ml-3 flex-1">
                        <Text className="text-base font-cairo-semibold text-white text-right">{product.title}</Text>
                        <Text className="text-xs font-cairo text-gray-400 mt-0.5 text-right">{product.subtitle}</Text>
                    </View>
                </View>

                {/* Center: Chart */}
                <View className="items-center justify-center px-4">
                    <View className="h-[30px] w-[80px]">
                        {TrendComponent && <TrendComponent />}
                    </View>
                </View>

                {/* Left: Price and Percentage */}
                <View className="items-start min-w-[80px]">
                    <View className="flex-row items-center">
                        <Text className="text-xs font-cairo text-gray-400 mr-1">ل.س</Text>
                        <Text className="text-lg font-cairo-bold text-white">{product.value}</Text>
                    </View>
                    <Text className={`text-sm font-cairo-semibold mt-0.5 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {product.percentage}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View className="flex-1 bg-gray-100">
                {/* Header */}
                <View className="bg-white px-4 py-4 pt-12 border-b border-gray-200">
                    <View className="flex-row items-center justify-between">
                        {/* Left: Damascus with icon */}
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-2">
                                <Text className="text-base">📊</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-sm font-cairo text-gray-500">فاتره حسب المحافظة</Text>
                                <Text className="text-base font-cairo-semibold text-green-700">دمشق</Text>
                            </View>
                        </View>

                        {/* Right: Title with chevron */}
                        <View className="flex-row items-center">
                            <Text className="text-lg font-cairo-bold text-black">تحليلات السوق</Text>
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="ml-2 w-8 h-8 items-center justify-center"
                            >
                                <Text className="text-2xl text-gray-600 font-bold">‹</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Products List */}
                <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}>
                    {products.map(renderProductCard)}
                </ScrollView>
            </View>
        </>
    );
}

