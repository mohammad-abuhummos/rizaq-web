import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    I18nManager,
    Image,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const isRTL = I18nManager.isRTL;

interface IntroSlide {
    id: number;
    image: any;
    title: string;
    description: string;
}

const slidesData: IntroSlide[] = [
    {
        id: 1,
        image: require('../assets/app/intro/1.png'),
        title: 'لوجستيات والدفع\nالمضمون بضغطتين',
        description:
            'خيارات نقل مضمونة حسب المسافة وتوفع المديونية والتزويد،\nمع ضمانِ حالة البضاعة لضمان. المدفوعات عبر حساب ضمان\nتصل للمزارعين بعد تأكيد الاستلام، مع تقارير دقيقة لوازارات (Escrow)',
    },
    {
        id: 2,
        image: require('../assets/app/intro/2.png'),
        title: 'بيع وشراء مزن: مزارع، مناقصة،\nأو سعر مباشر',
        description:
            'أَبقِ محصيلك بشامل الجودة والكمية والصور،\nواختر آلية البيع المناسبة: بنظى المشترى، عَرض\nشفاف منافسة حتى إتمام الصفقة لنتائج الأعلى',
    },
    {
        id: 3,
        image: require('../assets/app/intro/3.png'),
        title: 'سوق زراعي موثق\nيجمع الجميع',
        description:
            'حسابات معتمدة للمزارعين والتشارها والناقلين، مع توثيق\nواضح للهوية والبيانات لضمان مصداقية الموثوق وجُماعة\nالتعاملات من البداية',
    },
];

export default function IntroScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList<IntroSlide>>(null);
    const currentIndexRef = useRef(0);

    const totalSlides = slidesData.length;

    // Map between logical index (0..n-1) and the visual index used by FlatList when inverted in RTL
    const toVisualIndex = (logicalIndex: number) => (isRTL ? totalSlides - 1 - logicalIndex : logicalIndex);
    const fromVisualIndex = (visualIndex: number) => (isRTL ? totalSlides - 1 - visualIndex : visualIndex);

    const onViewRef = useRef(({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
        const visualIndex = viewableItems[0]?.index ?? 0;
        const logicalIndex = fromVisualIndex(visualIndex);
        if (logicalIndex !== currentIndexRef.current) {
            currentIndexRef.current = logicalIndex;
            setCurrentIndex(logicalIndex);
        }
    });
    const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 60 });

    const renderItem = ({ item }: { item: IntroSlide }) => (
        <View style={{ width }} className="flex-1 items-center px-6 pt-24">
            {/* Image Container */}
            <View className="justify-center items-center mb-12" style={{ height: height * 0.4 }}>
                <View
                    className="justify-center items-center"
                    style={{ width: 320, height: 320 }}
                >
                    <Image
                        source={item.image}
                        style={{ width: 280, height: 280 }}
                        resizeMode="contain"
                    />
                </View>
            </View>

            {/* Title */}
            <Text className="mb-6 text-2xl font-bold leading-10 text-center text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>
                {item.title}
            </Text>

            {/* Description */}
            <Text className="px-2 text-base leading-8 text-center text-gray-600" style={{ fontFamily: 'Cairo-Regular' }}>
                {item.description}
            </Text>
        </View>
    );

    const completeIntro = async () => {
        try {
            await AsyncStorage.setItem('hasSeenIntro', 'true');
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Error saving intro status:', error);
            router.replace('/(tabs)');
        }
    };

    const handleNext = () => {
        const nextIndex = currentIndexRef.current + 1;
        if (nextIndex < totalSlides) {
            currentIndexRef.current = nextIndex;
            setCurrentIndex(nextIndex);
            const targetIndex = toVisualIndex(nextIndex);
            flatListRef.current?.scrollToIndex({ index: targetIndex, animated: true });
        } else {
            completeIntro();
        }
    };

    const handleSkip = () => {
        completeIntro();
    };

    return (
        <View className="flex-1 bg-white">
            {/* Skip button */}
            {currentIndex < totalSlides - 1 && (
                <TouchableOpacity
                    onPress={handleSkip}
                    className="absolute right-6 top-12 z-10 px-4 py-2"
                >
                    <Text className="text-base text-gray-500">تخطي</Text>
                </TouchableOpacity>
            )}

            <FlatList
                ref={flatListRef}
                data={slidesData}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                initialScrollIndex={toVisualIndex(0)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                inverted={isRTL}
                onViewableItemsChanged={onViewRef.current}
                viewabilityConfig={viewConfigRef.current}
                getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                className="flex-1"
            />

            {/* Bottom Section */}
            <View className="px-6 pb-12">
                {/* Pagination Dots */}
                <View className="flex-row justify-center items-center mb-6">
                    {Array.from({ length: totalSlides }).map((_, index) => {
                        const isActive = index === currentIndex;
                        return (
                            <View
                                key={index}
                                className={`h-2 rounded-full mx-1 ${isActive ? 'w-2 bg-green-700' : 'w-2 bg-gray-300'}`}
                            />
                        );
                    })}
                </View>

                {/* Next/Start Button */}
                <TouchableOpacity
                    onPress={handleNext}
                    className="flex-row justify-center items-center py-4 bg-green-700 rounded-lg"
                    activeOpacity={0.8}
                >
                    <>
                        <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={20} color="white" style={{ marginRight: 8 }} />
                        <Text className="text-lg font-semibold text-white" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            {currentIndex === totalSlides - 1 ? 'ابدأ الآن' : currentIndex === 0 ? 'ابدأ الآن' : 'التالي'}
                        </Text>
                    </>
                </TouchableOpacity>
            </View>
        </View>
    );
}

