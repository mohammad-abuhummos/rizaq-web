import { useAuthGate } from '@/hooks/useAuthGate';
import { Image } from 'expo-image';
import React from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

export default function PromoCard() {
    const { width: screenWidth } = useWindowDimensions();
    const cardHeight = Math.round(Math.min(Math.max(screenWidth * 0.28, 88), 140));
    const titleLg = Math.round(Math.min(Math.max(screenWidth * 0.058, 16), 24));
    const titleMd = Math.round(Math.min(Math.max(screenWidth * 0.05, 14), 20));
    const { navigateGuarded } = useAuthGate();
    return (
        <View className="overflow-hidden relative mx-4 mb-6 rounded-2xl" style={{ height: cardHeight }}>
            <Image
                source={{
                    uri: "https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=800",
                }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
            />
            <View className="absolute top-0 right-0 bottom-0 left-0 flex-row items-center p-4 bg-black/50">
                {/* Left side - Button */}
                <View className="justify-start items-start" style={{ flex: 0.42 }}>
                    <TouchableOpacity onPress={navigateGuarded('/direct/new')} className="bg-green-700 px-5 py-2.5 rounded-lg">
                        <Text className="text-xs text-white font-cairo-bold">
                            اعرض منتجات ايضا
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Right side - Text content */}
                <View className="justify-center items-end" style={{ flex: 0.58 }}>
                    <Text
                        className="mb-1 leading-tight text-right text-white font-cairo-bold"
                        style={{ fontSize: titleLg }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                    >
                        بيع محاصيلك
                    </Text>
                    <Text
                        className="font-cairo-bold text-white text-right leading-tight mb-0.5"
                        style={{ fontSize: titleMd }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                    >
                        بسرعة وبريح عالي
                    </Text>
                    <Text
                        className="leading-tight text-right text-white font-cairo-bold"
                        style={{ fontSize: titleMd }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                    >
                        وبسوق واي
                    </Text>
                </View>
            </View>
        </View>
    );
}

