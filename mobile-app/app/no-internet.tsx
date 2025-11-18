import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

export default function NoInternetScreen() {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ])
        ).start();

        // Rotation animation
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
                easing: Easing.linear,
            })
        ).start();
    }, [pulseAnim, rotateAnim]);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View className="flex-1 bg-gradient-to-b from-blue-50 to-white items-center justify-center px-8">
            {/* Animated Icon Container */}
            <View className="mb-8 relative">
                <Animated.View
                    className="w-40 h-40 rounded-full bg-blue-100 items-center justify-center"
                    style={{ transform: [{ scale: pulseAnim }] }}
                >
                    <View className="w-32 h-32 rounded-full bg-blue-200 items-center justify-center">
                        <Ionicons name="cloud-offline-outline" size={64} color="#3B82F6" />
                    </View>
                </Animated.View>

                {/* Rotating Loading Ring */}
                <Animated.View
                    className="absolute top-0 left-0 right-0 bottom-0"
                    style={{ transform: [{ rotate }] }}
                >
                    <View className="w-40 h-40 rounded-full border-4 border-transparent border-t-blue-400 border-r-blue-300" />
                </Animated.View>
            </View>

            {/* Title */}
            <Text
                className="text-2xl text-gray-900 text-center mb-3"
                style={{ fontFamily: 'Cairo-Bold' }}
            >
                في انتظار الاتصال
            </Text>

            {/* Description */}
            <Text
                className="text-base text-gray-600 text-center leading-7 mb-2"
                style={{ fontFamily: 'Cairo-Regular' }}
            >
                يرجى التحقق من اتصالك بالإنترنت
            </Text>

            <Text
                className="text-sm text-gray-500 text-center leading-6"
                style={{ fontFamily: 'Cairo-Regular' }}
            >
                جاري محاولة الاتصال...
            </Text>

            {/* Animated Dots */}
            <View className="mt-10 flex-row gap-3">
                {[0, 1, 2].map((index) => (
                    <Animated.View
                        key={index}
                        className="w-3 h-3 rounded-full bg-blue-400"
                        style={{
                            opacity: pulseAnim.interpolate({
                                inputRange: [1, 1.2],
                                outputRange: [0.3, 1],
                            }),
                            transform: [
                                {
                                    translateY: pulseAnim.interpolate({
                                        inputRange: [1, 1.2],
                                        outputRange: [0, -5],
                                    }),
                                },
                            ],
                        }}
                    />
                ))}
            </View>

            {/* Status Info */}
            <View className="mt-12 px-6 py-4 bg-blue-50 rounded-2xl border border-blue-100">
                <View className="flex-row items-center">
                    <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
                    <Text
                        className="text-sm text-blue-600 mr-2"
                        style={{ fontFamily: 'Cairo-Regular' }}
                    >
                        سيتم الاتصال تلقائياً عند توفر الإنترنت
                    </Text>
                </View>
            </View>
        </View>
    );
}

