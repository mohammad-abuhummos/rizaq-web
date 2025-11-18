import { getRandomTrendSvg } from '@/components/ui/market/TrendSvgs';
import { useAuthGate } from '@/hooks/useAuthGate';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

interface ProductData {
    id: string;
    title: string;
    percentage: string;
    value: string;
    imageUrl: string;
    subtitle?: string;
}

const previewData: ProductData[] = [
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
];

const cities = ['دمشق', 'حمص', 'اللاذقية', 'درعا', 'حلب', 'طرطوس'];

export default function MarketAnalysisWidget() {
    const { navigateGuarded } = useAuthGate();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const imageSize = Math.round(Math.min(Math.max(screenWidth * 0.14, 44), 64));
    const chartWidth = Math.round(Math.min(Math.max(screenWidth * 0.22, 72), 120));
    const chartHeight = Math.round(Math.min(Math.max(screenWidth * 0.08, 24), 36));
    const priceMinWidth = Math.round(Math.min(Math.max(screenWidth * 0.22, 80), 120));
    const gradientHeight = Math.round(Math.min(Math.max(screenHeight * 0.22, 180), 320));
    const [products, setProducts] = useState<ProductData[]>(previewData);
    const [selectedCity, setSelectedCity] = useState('دمشق');
    const [trendComponents, setTrendComponents] = useState<{ [key: string]: React.ComponentType }>({});

    // Shuffle products when city changes
    const handleCityChange = (city: string) => {
        setSelectedCity(city);

        // Shuffle the products array
        const shuffled = [...products].sort(() => Math.random() - 0.5);

        // Also slightly modify values to make it seem different
        const modifiedProducts = shuffled.map(product => {
            const currentValue = parseInt(product.value.replace(',', ''));
            const variation = (Math.random() - 0.5) * 10; // -5% to +5%
            const newValue = Math.floor(currentValue * (1 + variation / 100));
            const formattedValue = newValue.toLocaleString('en-US');

            const percentChange = ((newValue - currentValue) / currentValue * 100).toFixed(1);
            const sign = parseFloat(percentChange) >= 0 ? '+' : '';

            return {
                ...product,
                value: formattedValue,
                percentage: `${sign}${percentChange}%`,
            };
        });

        setProducts(modifiedProducts);
    };

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
                    // Random chance to update
                    if (Math.random() > 0.7) {
                        const currentValue = parseInt(product.value.replace(',', ''));
                        const changePercent = (Math.random() - 0.5) * 20;
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
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const renderProductCard = (product: ProductData) => {
        const isPositive = product.percentage.startsWith('+');
        const TrendComponent = trendComponents[product.id];

        return (
            <View key={product.id} className="flex-row items-center bg-[#2d2d2d] rounded-xl p-4 mb-3">
                {/* Right: Image and Product Info */}
                <View className="flex-row flex-1 items-center">
                    <Image
                        source={{ uri: product.imageUrl }}
                        style={{ width: imageSize, height: imageSize, borderRadius: 8 }}
                        contentFit="cover"
                    />
                    <View className="flex-1 items-start ml-3">
                        <Text className="text-base text-right text-white font-cairo-semibold" numberOfLines={1} ellipsizeMode="tail">{product.title}</Text>
                        <Text className="text-xs font-cairo text-gray-400 mt-0.5 text-right" numberOfLines={1} ellipsizeMode="tail">{product.subtitle}</Text>
                    </View>
                </View>

                {/* Center: Chart */}
                <View className="justify-center items-center px-4">
                    <View style={{ height: chartHeight, width: chartWidth }}>
                        {TrendComponent && <TrendComponent />}
                    </View>
                </View>

                {/* Left: Price and Percentage */}
                <View className="items-start" style={{ minWidth: priceMinWidth }}>
                    <View className="flex-row items-center">
                        <Text className="mr-1 text-xs text-gray-400 font-cairo">ل.س</Text>
                        <Text className="text-lg text-white font-cairo-bold">{product.value}</Text>
                    </View>
                    <Text className={`text-sm font-cairo-semibold mt-0.5 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {product.percentage}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View className="overflow-hidden bg-gray-100 rounded-2xl">
            {/* Header with Cities Tabs */}
            <View className="px-4 pt-3">
                {/* Cities Tabs - Horizontal scroll for overflow */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                    <View className="flex-row items-center">
                        {cities.map((city, index) => (
                            <TouchableOpacity
                                key={city}
                                onPress={() => handleCityChange(city)}
                                style={{ marginRight: index === cities.length - 1 ? 0 : 16 }}
                            >
                                <Text className={`font-cairo-bold text-lg ${selectedCity === city ? 'text-green-600' : 'text-gray-700'}`}>
                                    {city}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Products Cards with Gradient Overlay */}
            <View className="relative">
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={navigateGuarded('/market-analysis')}
                    className="px-4 pt-4 pb-4"
                >
                    {products.map(renderProductCard)}
                </TouchableOpacity>

                {/* Gradient Overlay from bottom */}
                <LinearGradient
                    colors={['transparent', 'rgba(243, 244, 246, 0.3)', 'rgba(243, 244, 246, 0.7)', 'rgb(243, 244, 246)']}
                    locations={[0, 0.3, 0.7, 1]}
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: gradientHeight,
                        pointerEvents: 'none',
                    }}
                />

                {/* View More Button - On top of gradient */}
                <View
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                    }}
                    className="items-center py-4"
                >
                    <TouchableOpacity
                        onPress={navigateGuarded('/market-analysis')}
                        className="px-6 py-3 bg-green-600 rounded-lg"
                        activeOpacity={0.8}
                    >
                        <Text className="text-base text-white font-cairo-bold">شاهد تحليلات السوق</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

