import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import {
    StoredNotification,
    clearNotifications,
    getStoredNotifications,
    markNotificationAsRead,
    removeNotification,
    resolveNavigationParams,
} from '@/services/localNotificationService';

const getNotificationIcon = (action?: StoredNotification['action']) => {
    if (action?.type === 'navigate') {
        if (action.route.includes('auction')) {
            return 'hammer-outline';
        }
        if (action.route.includes('tender')) {
            return 'document-text-outline';
        }
        if (action.route.includes('order')) {
            return 'cart-outline';
        }
    }

    return 'notifications-outline';
};

const getNotificationColor = (action?: StoredNotification['action']) => {
    if (action?.type === 'navigate') {
        if (action.route.includes('auction')) {
            return '#3B82F6';
        }
        if (action.route.includes('tender')) {
            return '#10B981';
        }
        if (action.route.includes('order')) {
            return '#F59E0B';
        }
    }

    return '#6B7280';
};

const formatTimeSince = (iso: string) => {
    const createdAt = new Date(iso);
    const diffMs = Date.now() - createdAt.getTime();

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < minute) {
        return 'الآن';
    }

    if (diffMs < hour) {
        const minutes = Math.floor(diffMs / minute);
        if (minutes === 1) {
            return 'منذ دقيقة واحدة';
        }
        if (minutes < 10) {
            return `منذ ${minutes} دقائق`;
        }
        return `منذ ${minutes} دقيقة`;
    }

    if (diffMs < day) {
        const hours = Math.floor(diffMs / hour);
        if (hours === 1) {
            return 'منذ ساعة واحدة';
        }
        if (hours < 10) {
            return `منذ ${hours} ساعات`;
        }
        return `منذ ${hours} ساعة`;
    }

    return createdAt.toLocaleDateString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function NotificationsScreen() {
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<StoredNotification[]>([]);

    const loadNotifications = useCallback(async () => {
        setLoading(true);
        const stored = await getStoredNotifications();
        setNotifications(stored);
        setLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadNotifications();
        }, [loadNotifications])
    );

    const handleClearNotifications = useCallback(async () => {
        await clearNotifications();
        setNotifications([]);
    }, []);

    const handleNotificationPress = useCallback(async (notification: StoredNotification) => {
        await markNotificationAsRead(notification.id);
        setNotifications(prev =>
            prev.map(item => (item.id === notification.id ? { ...item, read: true } : item))
        );

        const target = resolveNavigationParams(notification.action);
        if (target) {
            router.push({ pathname: target.route, params: target.params } as any);
        }
    }, []);

    const handleDeleteNotification = useCallback(async (id: string) => {
        await removeNotification(id);
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    return (
        <ScrollView className="flex-1 bg-white">
            {/* Header */}
            <View className="pt-14 pb-6 px-5 bg-white border-b border-gray-100">
                <Text className="text-2xl font-bold text-center text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>
                    الاشعارات
                </Text>
                {notifications.length > 0 && !loading && (
                    <TouchableOpacity
                        onPress={handleClearNotifications}
                        className="absolute left-5 bottom-6"
                    >
                        <Text className="text-sm text-red-500" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            مسح الكل
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Loading State */}
            {loading && (
                <View className="flex-1 items-center justify-center px-8 py-20">
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text
                        className="text-base text-gray-500 text-center mt-4"
                        style={{ fontFamily: 'Cairo-Regular' }}
                    >
                        جاري تحميل الإشعارات...
                    </Text>
                </View>
            )}

            {/* Notifications List */}
            {!loading && notifications.length > 0 && (
                <View className="px-4 py-2">
                    {notifications.map(notification => (
                        <TouchableOpacity
                            key={notification.id}
                            onPress={() => handleNotificationPress(notification)}
                            className={`mb-3 p-4 rounded-xl border ${notification.read
                                    ? 'bg-white border-gray-100'
                                    : 'bg-blue-50 border-blue-100'
                                }`}
                        >
                            <View className="flex-row items-start">
                                {/* Icon */}
                                <View
                                    className="w-12 h-12 rounded-full items-center justify-center mr-3"
                                    style={{ backgroundColor: `${getNotificationColor(notification.action)}15` }}
                                >
                                    <Ionicons
                                        name={getNotificationIcon(notification.action) as any}
                                        size={24}
                                        color={getNotificationColor(notification.action)}
                                    />
                                </View>

                                {/* Content */}
                                <View className="flex-1">
                                    <View className="flex-row items-center justify-between mb-1">
                                        <Text
                                            className="text-base text-gray-900 flex-1"
                                            style={{ fontFamily: 'Cairo-Bold' }}
                                        >
                                            {notification.title}
                                        </Text>
                                        <TouchableOpacity onPress={() => handleDeleteNotification(notification.id)}>
                                            <Text className="text-xs text-red-500" style={{ fontFamily: 'Cairo-Regular' }}>
                                                حذف
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text
                                        className="text-sm text-gray-600 mb-2 leading-5"
                                        style={{ fontFamily: 'Cairo-Regular' }}
                                    >
                                        {notification.message}
                                    </Text>
                                    <Text
                                        className="text-xs text-gray-400"
                                        style={{ fontFamily: 'Cairo-Regular' }}
                                    >
                                        {formatTimeSince(notification.createdAt)}
                                    </Text>
                                </View>
                            </View>
                            {!notification.read && (
                                <View className="w-2 h-2 rounded-full bg-blue-500 mt-3 self-start" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Empty State */}
            {!loading && notifications.length === 0 && (
                <View className="flex-1 items-center justify-center px-8 py-20">
                    {/* Icon Container */}
                    <View className="mb-6 w-32 h-32 rounded-full bg-gray-50 items-center justify-center">
                        <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center">
                            <Ionicons name="notifications-off-outline" size={56} color="#9CA3AF" />
                        </View>
                    </View>

                    {/* Title */}
                    <Text
                        className="text-2xl text-gray-900 text-center mb-3"
                        style={{ fontFamily: 'Cairo-Bold' }}
                    >
                        لا توجد إشعارات
                    </Text>

                    {/* Description */}
                    <Text
                        className="text-base text-gray-500 text-center leading-6 mb-2"
                        style={{ fontFamily: 'Cairo-Regular' }}
                    >
                        ليس لديك أي إشعارات في الوقت الحالي
                    </Text>

                    <Text
                        className="text-sm text-gray-400 text-center leading-5"
                        style={{ fontFamily: 'Cairo-Regular' }}
                    >
                        عندما تتلقى إشعارات جديدة، ستظهر هنا
                    </Text>

                    {/* Decorative Elements */}
                    <View className="mt-10 flex-row gap-2">
                        <View className="w-2 h-2 rounded-full bg-gray-200" />
                        <View className="w-2 h-2 rounded-full bg-gray-300" />
                        <View className="w-2 h-2 rounded-full bg-gray-200" />
                    </View>
                </View>
            )}
        </ScrollView>
    );
}
