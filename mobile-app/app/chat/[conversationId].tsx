import { Ionicons } from '@expo/vector-icons';
import * as signalR from '@microsoft/signalr';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, KeyboardAvoidingView, KeyboardEvent, Platform, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ChatConversation,
  ChatMessage,
  ChatMessagesPage,
  getConversation,
  getConversationMessages,
  sendMessage,
} from '@/services/chat';
import { getAuthToken, getAuthUser } from '@/storage/auth-storage';
import { getApiBaseUrl } from '@/utils/config';

const PAGE_SIZE = 50;
const KEYBOARD_VERTICAL_OFFSET = Platform.select({
  ios: 0,
  android: 24,
  default: 0,
});
const KEYBOARD_SHOW_EVENT = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const KEYBOARD_HIDE_EVENT = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

type MessageListItem = ChatMessage & { key: string };

const TZ_OFFSET_REGEX = /([zZ]|[+-]\d{2}:\d{2})$/;

const parseTimestampString = (value?: string | null): Date | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (TZ_OFFSET_REGEX.test(trimmed)) {
    const dateWithOffset = new Date(trimmed);
    return Number.isNaN(dateWithOffset.getTime()) ? null : dateWithOffset;
  }

  const utcDate = new Date(`${trimmed}Z`);
  if (!Number.isNaN(utcDate.getTime())) {
    const now = Date.now();
    if (utcDate.getTime() - now > 5 * 60 * 1000) {
      const localDate = new Date(trimmed);
      return Number.isNaN(localDate.getTime()) ? utcDate : localDate;
    }
    return utcDate;
  }

  const localDate = new Date(trimmed);
  return Number.isNaN(localDate.getTime()) ? null : localDate;
};

const normalizeTimestampString = (value?: string | null): string | null => {
  const date = parseTimestampString(value);
  if (!date) return value ?? null;
  return date.toISOString();
};

export default function ConversationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { conversationId } = useLocalSearchParams<{ conversationId?: string }>();
  const numericConversationId = useMemo(() => {
    const parsed = Number(conversationId);
    return Number.isFinite(parsed) ? parsed : NaN;
  }, [conversationId]);

  const listRef = useRef<FlatList<MessageListItem> | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pageInfo, setPageInfo] = useState<{ page: number; totalCount: number; pageSize: number }>({
    page: 1,
    totalCount: 0,
    pageSize: PAGE_SIZE,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [connectingSocket, setConnectingSocket] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const hasValidId = Number.isFinite(numericConversationId) && numericConversationId > 0;

  const normalizeMessage = useCallback((msg: ChatMessage): ChatMessage => {
    const normalizedSentAt = normalizeTimestampString(msg.sentAt) ?? new Date().toISOString();
    return {
      ...msg,
      body: msg.body ?? '',
      isSystem: Boolean(msg.isSystem),
      sentAt: normalizedSentAt,
    };
  }, []);

  const upsertMessages = useCallback((incoming: ChatMessage[], replace = false) => {
    if (!incoming || incoming.length === 0) return;
    const normalizedIncoming = incoming.map(normalizeMessage);
    setMessages(prev => {
      const map = new Map<number, ChatMessage>();
      if (!replace) {
        prev.forEach(msg => {
          map.set(msg.messageId, msg);
        });
      }
      normalizedIncoming.forEach(msg => {
        map.set(msg.messageId, msg);
      });
      return Array.from(map.values()).sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
    });
  }, [normalizeMessage]);

  const normalizeHubMessage = useCallback(
    (raw: any): ChatMessage | null => {
      if (!raw) return null;
      const candidate = raw.message ?? raw.data ?? raw;
      const conversationIdValue = candidate.conversationId ?? raw.conversationId ?? numericConversationId;
      if (!conversationIdValue || conversationIdValue !== numericConversationId) {
        return null;
      }

      const body = candidate.body ?? candidate.text ?? candidate.message ?? '';
      const senderUserIdValue = candidate.senderUserId ?? candidate.senderId ?? candidate.sender?.userId ?? currentUserId ?? 0;
      const sentAtValue = candidate.sentAt ?? candidate.createdAt ?? new Date().toISOString();

      return normalizeMessage({
        messageId: candidate.messageId ?? candidate.id ?? Date.now(),
        conversationId: conversationIdValue,
        senderUserId: senderUserIdValue,
        body,
        isSystem: Boolean(candidate.isSystem),
        sentAt: sentAtValue,
        attachments: candidate.attachments ?? candidate.files ?? [],
      });
    },
    [currentUserId, normalizeMessage, numericConversationId]
  );

  useEffect(() => {
    const handleKeyboardShow = (event: KeyboardEvent) => {
      const height = event?.endCoordinates?.height ?? 0;
      setKeyboardHeight(height);
    };
    const handleKeyboardHide = () => {
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener(KEYBOARD_SHOW_EVENT, handleKeyboardShow);
    const hideSub = Keyboard.addListener(KEYBOARD_HIDE_EVENT, handleKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const keyboardOffset = useMemo(() => Math.max(0, keyboardHeight - insets.bottom), [insets.bottom, keyboardHeight]);

  const parseApiResponse = <T,>(res: any): T | null => {
    if (!res) return null;
    if (res?.data?.data !== undefined) return res.data.data as T;
    if (res?.data !== undefined) return res.data as T;
    return res as T;
  };

  const loadConversation = useCallback(async () => {
    if (!hasValidId) {
      setError('معرف المحادثة غير صالح.');
      return;
    }
    try {
      const res = await getConversation(numericConversationId);
      const data = parseApiResponse<ChatConversation>(res);
      if (data) {
        setConversation(data);
      }
    } catch (e: any) {
      console.error('Failed to fetch conversation', e);
      setError(e?.message || 'تعذر تحميل تفاصيل المحادثة.');
    }
  }, [hasValidId, numericConversationId]);

  const loadMessages = useCallback(
    async (targetPage: number, { replace }: { replace: boolean }) => {
      if (!hasValidId) return;
      if (targetPage === 1 && replace) {
        setRefreshing(true);
      } else if (targetPage > 1) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      try {
        const res = await getConversationMessages(numericConversationId, {
          page: targetPage,
          pageSize: PAGE_SIZE,
        });
        const data = parseApiResponse<ChatMessagesPage>(res) ?? undefined;
        const items = data?.items ?? [];
        upsertMessages(items, replace);
        setPageInfo({
          page: data?.pageNumber ?? targetPage,
          pageSize: data?.pageSize ?? PAGE_SIZE,
          totalCount: data?.totalCount ?? items.length,
        });
      } catch (e: any) {
        console.error('Failed to fetch messages', e);
        setError(e?.message || 'تعذر تحميل رسائل المحادثة.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [hasValidId, numericConversationId, upsertMessages]
  );

  const initialize = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([loadConversation(), loadMessages(1, { replace: true })]);
  }, [loadConversation, loadMessages]);

  useFocusEffect(
    useCallback(() => {
      initialize();
      return () => { };
    }, [initialize])
  );

  useEffect(() => {
    getAuthUser<{ userId?: number; id?: number }>()
      .then(user => {
        const uid = user?.userId ?? user?.id ?? null;
        setCurrentUserId(uid);
      })
      .catch(() => setCurrentUserId(null));
  }, []);

  useEffect(() => {
    if (!hasValidId) return;

    let isMounted = true;
    const startConnection = async () => {
      setConnectingSocket(true);
      try {
        const token = await getAuthToken();
        const baseUrl = getApiBaseUrl();
        const hubUrl = `${(baseUrl || '').replace(/\/$/, '')}/hubs/chat`;

        const hubOptions: signalR.IHttpConnectionOptions | undefined = token
          ? { accessTokenFactory: () => token }
          : undefined;

        const builder = new signalR.HubConnectionBuilder();
        if (hubOptions) {
          builder.withUrl(hubUrl, hubOptions);
        } else {
          builder.withUrl(hubUrl);
        }

        const connection = builder
          .withAutomaticReconnect()
          .build();

        connection.on('MessageCreated', (payload: any) => {
          if (!isMounted || !payload) return;
          const normalized = normalizeHubMessage(payload);
          if (normalized) {
            upsertMessages([normalized]);
          } else if ((payload?.conversationId ?? payload?.message?.conversationId) === numericConversationId) {
            loadMessages(1, { replace: false }).catch(() => { });
          }
        });

        connection.on('ConversationCreated', (payload: any) => {
          if (!payload || payload.conversationId !== numericConversationId) return;
          loadConversation();
        });

        connection.on('MessagesRead', (payload: any) => {
          // Placeholder for read receipts handling if needed later
        });

        connection.onreconnected(() => {
          connection.invoke('JoinConversation', numericConversationId).catch(() => { });
          loadMessages(1, { replace: false }).catch(() => { });
        });

        await connection.start();
        if (!isMounted) {
          await connection.stop();
          return;
        }
        connectionRef.current = connection;
        try {
          await connection.invoke('JoinConversation', numericConversationId);
        } catch (joinErr) {
          console.warn('Failed to join conversation hub room', joinErr);
        }
      } catch (e) {
        console.error('Failed to initialize chat hub connection', e);
      } finally {
        if (isMounted) {
          setConnectingSocket(false);
        }
      }
    };

    startConnection();

    return () => {
      isMounted = false;
      const conn = connectionRef.current;
      connectionRef.current = null;
      if (conn) {
        conn.off('MessageCreated');
        conn.off('ConversationCreated');
        conn.off('MessagesRead');
        conn
          .stop()
          .catch(() => { });
      }
    };
  }, [hasValidId, loadConversation, loadMessages, normalizeHubMessage, numericConversationId, upsertMessages]);

  const handleSend = useCallback(async () => {
    if (!hasValidId || !inputValue.trim() || !currentUserId) {
      return;
    }
    const body = inputValue.trim();
    setSending(true);
    try {
      const connection = connectionRef.current;
      if (connection && connection.state === signalR.HubConnectionState.Connected) {
        await connection.invoke('SendMessage', {
          conversationId: numericConversationId,
          senderUserId: currentUserId,
          body,
        });
      } else {
        await sendMessage({
          conversationId: numericConversationId,
          senderUserId: currentUserId,
          body,
        });
        upsertMessages([
          {
            messageId: Date.now(),
            conversationId: numericConversationId,
            senderUserId: currentUserId,
            body,
            isSystem: false,
            sentAt: new Date().toISOString(),
          },
        ]);
      }
      setInputValue('');
      setError(null);
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ animated: true, offset: 0 });
      });
    } catch (e: any) {
      console.error('Failed to send message', e);
      setError(e?.message || 'تعذر إرسال الرسالة.');
    } finally {
      setSending(false);
    }
  }, [currentUserId, hasValidId, inputValue, numericConversationId, upsertMessages]);

  const loadNextPage = useCallback(() => {
    if (loadingMore || refreshing) return;
    const totalLoaded = messages.length;
    if (totalLoaded >= pageInfo.totalCount) return;
    const nextPage = pageInfo.page + 1;
    loadMessages(nextPage, { replace: false });
  }, [loadingMore, loadMessages, messages.length, pageInfo.page, pageInfo.totalCount, refreshing]);

  const handleRefresh = useCallback(() => {
    if (refreshing) return;
    setError(null);
    loadMessages(1, { replace: true });
  }, [loadMessages, refreshing]);

  const infoRows = useMemo(() => {
    if (!conversation) return [];
    return [
      { label: 'نوع السياق', value: conversation.contextType },
      { label: 'معرّف السياق', value: conversation.contextId },
      { label: 'الحالة', value: conversation.status },
    ];
  }, [conversation]);

  const showAssignTransportButton = conversation?.transportAssigned === false;

  const handleAssignTransport = useCallback(() => {
    if (!conversation) return;
    router.push({
      pathname: '/transport-prices',
      params: {
        conversationId: String(conversation.conversationId),
        contextType: conversation.contextType,
        contextId: String(conversation.contextId),
      },
    });
  }, [conversation, router]);

  useEffect(() => {
    navigation.setOptions?.({
      headerShown: false,
    });
  }, [navigation]);

  const reversedMessages: MessageListItem[] = useMemo(() => {
    if (!messages) return [];
    return [...messages]
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      .map(msg => ({ ...msg, key: String(msg.messageId) }));
  }, [messages]);

  const hasMore = messages.length < pageInfo.totalCount;

  if (!hasValidId) {
    return (
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: '#F9FAFB' }}>
        <LinearGradient
          colors={['#FFFFFF', '#F9FAFB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            alignItems: 'center',
            padding: 40,
            borderRadius: 32,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            maxWidth: 340,
          }}
        >
          <LinearGradient
            colors={['#FEE2E2', '#FEF2F2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <Ionicons name="warning" size={56} color="#DC2626" />
          </LinearGradient>

          <Text className="text-2xl text-center mb-3" style={{ fontFamily: 'Cairo-Bold', color: '#1F2937' }}>
            خطأ في المحادثة
          </Text>
          <Text className="text-base text-center mb-8" style={{ fontFamily: 'Cairo-Regular', color: '#6B7280', lineHeight: 24 }}>
            معرف المحادثة غير صالح أو غير موجود
          </Text>

          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="w-full"
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                paddingHorizontal: 32,
                borderRadius: 20,
                alignItems: 'center',
              }}
            >
              <Text className="text-lg" style={{ fontFamily: 'Cairo-Bold', color: '#FFFFFF' }}>
                العودة للخلف
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  const renderMessage = ({ item }: { item: MessageListItem }) => {
    const isMine = currentUserId != null && item.senderUserId === currentUserId;
    const isSystem = item.isSystem;
    const alignment = isSystem ? 'center' : isMine ? 'flex-end' : 'flex-start';

    if (isSystem) {
      return (
        <View className="mb-5 items-center">
          <View className="px-5 py-2.5 rounded-full bg-gray-100/80 max-w-[80%]">
            <Text className="text-xs text-center" style={{ fontFamily: 'Cairo-Medium', color: '#6B7280' }}>
              {item.body}
            </Text>
          </View>
          <Text className="text-xs mt-1.5" style={{ fontFamily: 'Cairo-Regular', color: '#9CA3AF' }}>
            {formatTimestamp(item.sentAt)}
          </Text>
        </View>
      );
    }

    return (
      <View className="mb-4 px-1" style={{ alignItems: alignment as any }}>
        {isMine ? (
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              maxWidth: '80%',
              paddingHorizontal: 18,
              paddingVertical: 13,
              borderRadius: 24,
              borderTopRightRadius: 24,
              borderBottomRightRadius: 6,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: 'Cairo-Regular', fontSize: 15, lineHeight: 24 }}>
              {item.body}
            </Text>
          </LinearGradient>
        ) : (
          <View
            className="bg-white max-w-[80%]"
            style={{
              paddingHorizontal: 18,
              paddingVertical: 13,
              borderRadius: 24,
              borderTopLeftRadius: 24,
              borderBottomLeftRadius: 6,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <Text style={{ color: '#1F2937', fontFamily: 'Cairo-Regular', fontSize: 15, lineHeight: 24 }}>
              {item.body}
            </Text>
          </View>
        )}
        <Text
          className="text-xs mt-1.5"
          style={{
            fontFamily: 'Cairo-Regular',
            color: '#9CA3AF',
            marginRight: isMine ? 8 : 0,
            marginLeft: isMine ? 0 : 8,
          }}
        >
          {formatTimestamp(item.sentAt)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F9FAFB' }}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={KEYBOARD_VERTICAL_OFFSET + insets.top}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F9FAFB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            paddingTop: 16,
            paddingBottom: 16,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          }}
        >
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              className="w-12 h-12 rounded-2xl items-center justify-center"
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <View className="flex-1 items-center px-4">
              <Text className="text-xl" style={{ fontFamily: 'Cairo-Bold', color: '#1F2937' }} numberOfLines={1}>
                {conversation?.contextType ? `محادثة ${conversation.contextType}` : 'المحادثة'}
              </Text>
              {conversation?.contextId && (
                <View className="flex-row items-center mt-1">
                  <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#10B981' }} />
                  <Text className="text-xs" style={{ fontFamily: 'Cairo-Medium', color: '#6B7280' }}>
                    #{conversation.contextId}
                  </Text>
                </View>
              )}
            </View>
            <View className="w-12" />
          </View>
        </LinearGradient>

        {error && !loading && (
          <View className="mx-5 mt-3">
            <LinearGradient
              colors={['#FEE2E2', '#FEF2F2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: '#FECACA',
              }}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: '#DC2626' }}>
                  <Ionicons name="alert-circle-outline" size={20} color="#FFFFFF" />
                </View>
                <Text className="flex-1 text-sm" style={{ fontFamily: 'Cairo-Medium', color: '#991B1B' }}>
                  {error}
                </Text>
              </View>
              <TouchableOpacity
                onPress={initialize}
                activeOpacity={0.8}
                className="mt-3 py-2.5 rounded-xl items-center"
                style={{ backgroundColor: '#DC2626' }}
              >
                <Text className="text-sm" style={{ fontFamily: 'Cairo-SemiBold', color: '#FFFFFF' }}>
                  إعادة المحاولة
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {conversation && (
          <View className="mx-5 mt-3">
            <LinearGradient
              colors={['#FFFFFF', '#F9FAFB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              {infoRows.map((row, index) => (
                <View
                  key={row.label}
                  className="flex-row items-center justify-between py-2"
                  style={{ borderBottomWidth: index < infoRows.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }}
                >
                  <Text className="text-sm" style={{ fontFamily: 'Cairo-Medium', color: '#6B7280' }}>
                    {row.label}
                  </Text>
                  <View className="px-3 py-1 rounded-lg" style={{ backgroundColor: '#EFF6FF' }}>
                    <Text className="text-sm" style={{ fontFamily: 'Cairo-Bold', color: '#3B82F6' }}>
                      {row.value}
                    </Text>
                  </View>
                </View>
              ))}
              {showAssignTransportButton && (
                <View className="mt-4">
                  <TouchableOpacity
                    onPress={handleAssignTransport}
                    activeOpacity={0.85}
                    className="w-full"
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        paddingVertical: 14,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: 'Cairo-Bold', color: '#FFFFFF', fontSize: 16 }}>
                        تعيين النقل
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
              {connectingSocket && (
                <View className="flex-row items-center justify-center mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text className="text-xs mr-2" style={{ fontFamily: 'Cairo-Medium', color: '#3B82F6' }}>
                    جاري الاتصال...
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>
        )}

        {loading && messages.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <LinearGradient
              colors={['#EFF6FF', '#DBEAFE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                padding: 32,
                borderRadius: 28,
                borderWidth: 1,
                borderColor: '#BFDBFE',
              }}
            >
              <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
              <Text className="text-lg" style={{ fontFamily: 'Cairo-Bold', color: '#1E40AF' }}>
                جاري التحميل
              </Text>
              <Text className="text-sm mt-2" style={{ fontFamily: 'Cairo-Regular', color: '#3B82F6' }}>
                يرجى الانتظار...
              </Text>
            </LinearGradient>
          </View>
        ) : (
          <>
            <FlatList
              ref={listRef}
              data={reversedMessages}
              renderItem={renderMessage}
              keyExtractor={item => item.key}
              className="flex-1"
              style={{ paddingHorizontal: 20 }}
              contentContainerStyle={{ paddingVertical: 24, paddingBottom: 12 + keyboardOffset }}
              inverted
              onEndReachedThreshold={0.1}
              onEndReached={hasMore ? loadNextPage : undefined}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListFooterComponent={
                loadingMore && hasMore ? (
                  <View className="py-5 items-center justify-center">
                    <LinearGradient
                      colors={['#EFF6FF', '#DBEAFE']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        borderRadius: 20,
                      }}
                    >
                      <ActivityIndicator size="small" color="#3B82F6" />
                      <Text className="text-xs mr-3" style={{ fontFamily: 'Cairo-SemiBold', color: '#3B82F6' }}>
                        تحميل المزيد...
                      </Text>
                    </LinearGradient>
                  </View>
                ) : !hasMore && messages.length > 0 ? (
                  <View className="py-5 items-center justify-center">
                    <View className="px-5 py-2 rounded-full" style={{ backgroundColor: 'rgba(156, 163, 175, 0.1)' }}>
                      <Text className="text-xs" style={{ fontFamily: 'Cairo-Medium', color: '#9CA3AF' }}>
                        • • •
                      </Text>
                    </View>
                  </View>
                ) : null
              }
              ListEmptyComponent={
                !loading ? (
                  <View className="flex-1 items-center justify-center py-24">
                    <LinearGradient
                      colors={['#F3F4F6', '#E5E7EB']}
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: 48,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 20,
                      }}
                    >
                      <Ionicons name="chatbubbles" size={48} color="#9CA3AF" />
                    </LinearGradient>
                    <Text className="text-lg mb-2" style={{ fontFamily: 'Cairo-Bold', color: '#374151' }}>
                      لا توجد رسائل
                    </Text>
                    <Text className="text-sm text-center" style={{ fontFamily: 'Cairo-Regular', color: '#9CA3AF' }}>
                      ابدأ محادثتك الآن بكتابة رسالة
                    </Text>
                  </View>
                ) : null
              }
            />

            <View
              className="px-5"
              style={{
                backgroundColor: '#FFFFFF',
                borderTopWidth: 1,
                borderTopColor: '#E5E7EB',
                paddingTop: 16,
                paddingBottom: 16 + insets.bottom + keyboardOffset,
              }}
            >
              <View className="flex-row items-end gap-3">
                <View
                  className="flex-1 flex-row items-end rounded-3xl px-4 py-2"
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderWidth: 2,
                    borderColor: inputValue.trim() ? '#3B82F6' : '#E5E7EB',
                    minHeight: 50,
                  }}
                >
                  <TextInput
                    value={inputValue}
                    onChangeText={setInputValue}
                    placeholder="اكتب رسالتك..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    returnKeyType="default"
                    blurOnSubmit={false}
                    textAlignVertical="center"
                    style={{
                      flex: 1,
                      maxHeight: 120,
                      fontFamily: 'Cairo-Regular',
                      fontSize: 15,
                      color: '#111827',
                      paddingTop: Platform.OS === 'ios' ? 12 : 8,
                      paddingBottom: Platform.OS === 'ios' ? 12 : 8,
                      lineHeight: 24,
                    }}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleSend}
                  disabled={sending || !inputValue.trim()}
                  activeOpacity={0.8}
                  className="w-12 h-12 rounded-2xl items-center justify-center"
                >
                  {sending ? (
                    <View className="w-full h-full rounded-2xl items-center justify-center" style={{ backgroundColor: '#E5E7EB' }}>
                      <ActivityIndicator size="small" color="#9CA3AF" />
                    </View>
                  ) : (
                    <LinearGradient
                      colors={inputValue.trim() ? ['#3B82F6', '#2563EB'] : ['#E5E7EB', '#E5E7EB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name="send"
                        size={22}
                        color={inputValue.trim() ? '#FFFFFF' : '#9CA3AF'}
                      />
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatTimestamp(value?: string) {
  const date = parseTimestampString(value);
  if (!date) return '';

  const now = Date.now();
  const diffRaw = now - date.getTime();
  const diff = diffRaw < 0 ? 0 : diffRaw;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'الآن';
  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return minutes <= 1 ? 'قبل دقيقة' : `قبل ${minutes} دقائق`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return hours <= 1 ? 'قبل ساعة' : `قبل ${hours} ساعات`;
  }

  return date.toLocaleString('ar-EG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}


