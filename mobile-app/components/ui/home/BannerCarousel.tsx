import React from 'react';
import {
    ImageBackground,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Swiper from 'react-native-swiper';

export interface Banner {
    id: string;
    image: string;
    title: string;
    subtitle: string;
    buttonLabel?: string;
}

export interface BannerCarouselProps {
    data: Banner[];
    onBannerPress?: (bannerId: string) => void;
}

export const BannerCarousel = ({
    data,
    onBannerPress,
}: BannerCarouselProps) => {
    const renderBanner = (item: Banner, index: number) => (
        <View key={item.id} className="flex-1">
            <View className="mx-4 h-24 rounded-2xl overflow-hidden">
                <ImageBackground
                    source={{ uri: item.image }}
                    className="w-full h-full"
                    imageStyle={{ borderRadius: 16 }}>
                    {/* Overlay */}
                    <View className="absolute inset-0 bg-black/30" />

                    {/* Content: Button (Left) | Text (Right) */}
                    <View className="flex-1 flex-row items-center justify-between px-3 py-4">
                        {/* Text Container - RIGHT (Arabic RTL) */}
                        <View className=" justify-start">
                            <Text
                                className="text-green-400 text-2xl font-cairo-bold mb-1 text-right"
                                numberOfLines={1}>
                                {item.title}
                            </Text>
                            <Text
                                className="text-white text-sm font-cairo text-left"
                                numberOfLines={1}>
                                {item.subtitle}
                            </Text>
                        </View>
                        <View className="justify-end pr-2">

                            {/* Action Button - LEFT */}
                            <TouchableOpacity
                                onPress={() => onBannerPress?.(item.id)}
                                activeOpacity={0.8}
                                className="bg-emerald-700 px-4 py-2.5 rounded-lg flex-shrink-0">
                                <Text className="text-white text-sm font-cairo-bold text-center">
                                    {item.buttonLabel || 'اعرف المزيد'}
                                </Text>
                            </TouchableOpacity>


                        </View>
                    </View>
                </ImageBackground>
            </View>
        </View>
    );

    return (
        <View>
            {/* Swiper Container */}
            <View className="h-24 my-3">
                <Swiper
                    autoplay={true}
                    autoplayTimeout={5}
                    loop={true}
                    index={0}
                    showsPagination={false}>
                    {data.map((banner, index) => renderBanner(banner, index))}
                </Swiper>
            </View>

            {/* Pagination Dots */}
            {/* <View className="flex-row justify-center items-center gap-1.5 py-2.5">
                {data.map((_, index) => (
                    <View
                        key={index}
                        className="w-1.5 h-1.5 rounded-full bg-gray-300"
                    />
                ))}
            </View> */}
        </View>
    );
};
