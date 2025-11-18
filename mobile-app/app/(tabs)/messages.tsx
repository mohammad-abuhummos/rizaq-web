import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ChatConversationSummary, listUserConversations } from '@/services/chat';
import { getAuthUser } from '@/storage/auth-storage';

const STATUS_STYLES: Record<string, { label: string; color: string; background: string }> = {
    open: { label: 'مفتوحة', color: '#16A34A', background: '#DCFCE7' },
    active: { label: 'نشطة', color: '#10B981', background: '#D1FAE5' },
    pending: { label: 'قيد الانتظار', color: '#F97316', background: '#FFEDD5' },
    closed: { label: 'مغلقة', color: '#DC2626', background: '#FEE2E2' },
    archived: { label: 'مؤرشفة', color: '#6B7280', background: '#E5E7EB' },
};

const CONTEXT_STYLES: Record<string, { label: string; icon: string; color: string; background: string }> = {
    direct: { label: 'محادثة مباشرة', icon: 'chatbubble-ellipses-outline', color: '#3B82F6', background: '#EFF6FF' },
    order: { label: 'طلب مباشر', icon: 'cart-outline', color: '#2563EB', background: '#DBEAFE' },
    auction: { label: 'محادثة مزاد', icon: 'hammer-outline', color: '#F59E0B', background: '#FEF3C7' },
    tender: { label: 'مناقصة', icon: 'document-text-outline', color: '#10B981', background: '#D1FAE5' },
    logistics: { label: 'خدمات نقل', icon: 'cube-outline', color: '#6366F1', background: '#EEF2FF' },
};

const resolveStatus = (status?: string) => {
    if (!status) {
        return { label: 'غير محدد', color: '#6B7280', background: '#E5E7EB' };
    }
    const key = status.toLowerCase();
    return STATUS_STYLES[key] ?? { label: status, color: '#2563EB', background: '#DBEAFE' };
};

const resolveContext = (context?: string) => {
    if (!context) {
        return { label: 'محادثة', icon: 'chatbubbles-outline', color: '#3B82F6', background: '#EFF6FF' };
    }
    const key = context.toLowerCase();
    return (
        CONTEXT_STYLES[key] ?? {
            label: context,
            icon: 'chatbubbles-outline',
            color: '#3B82F6',
            background: '#EFF6FF',
        }
    );
};

const getComparableDate = (conversation: ChatConversationSummary) => {
    const source = conversation.lastMessageAt || conversation.updatedAt || conversation.openedAt;
    if (!source) return 0;
    const timestamp = new Date(source).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
};

const formatRelativeTime = (iso?: string) => {
    if (!iso) return 'غير محدد';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'غير محدد';

    const diff = Date.now() - date.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;

    if (diff < minute) return 'الآن';
    if (diff < hour) {
        const minutes = Math.floor(diff / minute);
        return minutes <= 1 ? 'قبل دقيقة' : `قبل ${minutes} دقائق`;
    }
    if (diff < day) {
        const hours = Math.floor(diff / hour);
        return hours <= 1 ? 'قبل ساعة' : `قبل ${hours} ساعات`;
    }
    if (diff < week) {
        const days = Math.floor(diff / day);
        return days <= 1 ? 'أمس' : `قبل ${days} أيام`;
    }

    return date.toLocaleDateString('ar-EG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const formatFullDate = (iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('ar-EG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function MessagesScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);

    const fetchConversations = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const auth = await getAuthUser<{ userId?: number; id?: number; fullName?: string }>();
            const userId = auth?.userId ?? auth?.id;
            if (!userId) {
                throw new Error('تعذر تحديد هوية المستخدم. يرجى تسجيل الدخول مرة أخرى.');
            }

            const res = await listUserConversations(Number(userId));
            const raw = (res as any)?.data ?? res;
            const nested = (raw as any)?.data ?? raw;
            const items = Array.isArray(nested) ? nested : Array.isArray(raw) ? raw : [];

            setConversations(items as ChatConversationSummary[]);
        } catch (e: any) {
            console.error('Failed to load conversations', e);
            setConversations([]);
            setError(e?.message || 'حدث خطأ أثناء تحميل المحادثات.');
        } finally {
            if (isRefresh) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchConversations();
        }, [fetchConversations])
    );

    const onRefresh = useCallback(() => {
        fetchConversations(true);
    }, [fetchConversations]);

    const handleRetry = useCallback(() => {
        fetchConversations();
    }, [fetchConversations]);

    const sortedConversations = useMemo(() => {
        if (!conversations || conversations.length === 0) return [];
        return [...conversations].sort((a, b) => getComparableDate(b) - getComparableDate(a));
    }, [conversations]);

    const handleOpenConversation = useCallback(
        (conversation: ChatConversationSummary) => {
            router.push({
                pathname: '/chat/[conversationId]',
                params: { conversationId: String(conversation.conversationId) },
            });
        },
        [router]
    );

    return (
        <ScrollView
            className="flex-1 bg-white"
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#3B82F6"
                    colors={["#3B82F6"]}
                />
            }
        >
            {/* Header */}
            <View className="pt-14 pb-6 px-5 bg-white border-b border-gray-100">
                <Text className="text-2xl font-bold text-center text-gray-900" style={{ fontFamily: 'Cairo-Bold' }}>
                    المحادثات
                </Text>
                <Text className="text-sm text-gray-400 text-center mt-1" style={{ fontFamily: 'Cairo-Regular' }}>
                    عرض أحدث المحادثات عبر مختلف الخدمات
                </Text>
            </View>

            {/* Loading State */}
            {loading && (
                <View className="items-center justify-center px-8 py-20">
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text
                        className="text-base text-gray-500 text-center mt-4"
                        style={{ fontFamily: 'Cairo-Regular' }}
                    >
                        جاري تحميل المحادثات...
                    </Text>
                </View>
            )}

            {/* Error State */}
            {!loading && error && (
                <View className="items-center justify-center px-8 py-16">
                    <View className="w-20 h-20 rounded-full bg-red-50 items-center justify-center mb-4">
                        <Ionicons name="warning-outline" size={40} color="#EF4444" />
                    </View>
                    <Text className="text-lg text-red-600 text-center" style={{ fontFamily: 'Cairo-Bold' }}>
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={handleRetry}
                        className="mt-6 px-6 py-3 rounded-full bg-blue-500"
                    >
                        <Text className="text-white text-sm" style={{ fontFamily: 'Cairo-SemiBold' }}>
                            إعادة المحاولة
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Conversations List */}
            {!loading && !error && sortedConversations.length > 0 && (
                <View className="px-4 py-3">
                    {sortedConversations.map(conversation => {
                        const status = resolveStatus(conversation.status);
                        const context = resolveContext(conversation.contextType);
                        const unread = conversation.unreadCount ?? 0;
                        const subtitleParts: string[] = [];
                        if (conversation.contextId) {
                            subtitleParts.push(`#${conversation.contextId}`);
                        }
                        if (conversation.counterpartName) {
                            subtitleParts.push(conversation.counterpartName);
                        }
                        if (conversation.buyerUserId && conversation.sellerUserId) {
                            subtitleParts.push(`المشتري ${conversation.buyerUserId} - البائع ${conversation.sellerUserId}`);
                        }
                        const subtitle = subtitleParts.join(' • ');
                        const preview = conversation.lastMessageBody?.trim()
                            ? conversation.lastMessageBody
                            : 'لا توجد رسائل بعد في هذه المحادثة.';
                        const timeSource = conversation.lastMessageAt || conversation.updatedAt || conversation.openedAt;
                        const relativeTime = formatRelativeTime(timeSource);
                        const exactTime = formatFullDate(timeSource);

                        return (
                            <TouchableOpacity
                                key={conversation.conversationId}
                                activeOpacity={0.85}
                                onPress={() => handleOpenConversation(conversation)}
                                className="mb-3 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm"
                            >
                                <View className="flex-row items-start">
                                    <View
                                        className="w-14 h-14 rounded-full items-center justify-center mr-3"
                                        style={{ backgroundColor: context.background }}
                                    >
                                        <Ionicons name={context.icon as any} size={28} color={context.color} />
                                        {unread > 0 && (
                                            <View className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-red-500 items-center justify-center">
                                                <Text className="text-white text-xs" style={{ fontFamily: 'Cairo-Bold' }}>
                                                    {unread}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <View className="flex-1">
                                        <View className="flex-row items-center justify-between">
                                            <Text
                                                className="text-base text-gray-900 flex-1"
                                                style={{ fontFamily: 'Cairo-Bold' }}
                                                numberOfLines={1}
                                            >
                                                {context.label}
                                            </Text>
                                            <Text
                                                className="text-xs text-gray-400 ml-2"
                                                style={{ fontFamily: 'Cairo-Regular' }}
                                            >
                                                {relativeTime}
                                            </Text>
                                        </View>

                                        {!!subtitle && (
                                            <Text
                                                className="text-sm text-gray-500 mt-1"
                                                style={{ fontFamily: 'Cairo-Regular' }}
                                                numberOfLines={1}
                                            >
                                                {subtitle}
                                            </Text>
                                        )}

                                        <Text
                                            className="text-sm text-gray-700 mt-3"
                                            style={{ fontFamily: 'Cairo-Regular' }}
                                            numberOfLines={2}
                                        >
                                            {preview}
                                        </Text>

                                        <View className="flex-row items-center justify-between mt-3">
                                            <Text
                                                className="text-xs text-gray-400"
                                                style={{ fontFamily: 'Cairo-Regular' }}
                                            >
                                                رقم المحادثة: {conversation.conversationId}
                                            </Text>
                                            <View
                                                className="px-3 py-1 rounded-full"
                                                style={{ backgroundColor: status.background }}
                                            >
                                                <Text
                                                    className="text-xs"
                                                    style={{ fontFamily: 'Cairo-SemiBold', color: status.color }}
                                                >
                                                    {status.label}
                                                </Text>
                                            </View>
                                        </View>
                                        {!!exactTime && (
                                            <Text
                                                className="text-[11px] text-gray-400 mt-1"
                                                style={{ fontFamily: 'Cairo-Regular' }}
                                            >
                                                {exactTime}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {/* Empty State */}
            {!loading && !error && sortedConversations.length === 0 && (
                <View className="items-center justify-center px-8 py-20">
                    <View className="mb-6 w-28 h-28 rounded-full bg-gray-50 items-center justify-center">
                        <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center">
                            <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
                        </View>
                    </View>
                    <Text className="text-xl text-gray-900 text-center mb-2" style={{ fontFamily: 'Cairo-Bold' }}>
                        لا توجد محادثات بعد
                    </Text>
                    <Text
                        className="text-base text-gray-500 text-center leading-6"
                        style={{ fontFamily: 'Cairo-Regular' }}
                    >
                        عندما تبدأ تواصلك مع المشترين أو البائعين ستظهر محادثاتك هنا.
                    </Text>
                    <Text
                        className="text-sm text-gray-400 text-center leading-5 mt-3"
                        style={{ fontFamily: 'Cairo-Regular' }}
                    >
                        يمكنك فتح محادثة جديدة من صفحات الطلبات أو المزادات.
                    </Text>
                </View>
            )}
        </ScrollView>
    );
}
