import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import * as signalR from '@microsoft/signalr';
import { Header } from '~/components/Header';
import {
  type ChatConversation,
  type ChatMessage,
  type ChatMessagesPage,
  getConversation,
  getConversationMessages,
  sendMessage,
} from '~/lib/services/chat';
import { getAuthToken, getAuthUser } from '~/lib/storage/auth-storage';
import { getApiBaseUrl } from '~/lib/utils/config';

const PAGE_SIZE = 50;

const parseTimestampString = (value?: string | null): Date | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeTimestampString = (value?: string | null): string | null => {
  const date = parseTimestampString(value);
  if (!date) return value ?? null;
  return date.toISOString();
};

const formatTimestamp = (value?: string) => {
  const date = parseTimestampString(value);
  if (!date) return '';

  const now = Date.now();
  const diff = Math.max(0, now - date.getTime());
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
};

export default function ChatConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const numericConversationId = Number(conversationId);
  const hasValidId = Number.isFinite(numericConversationId) && numericConversationId > 0;

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, totalCount: 0, pageSize: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [connectingSocket, setConnectingSocket] = useState(false);
  const [connected, setConnected] = useState(false);

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
        prev.forEach(msg => map.set(msg.messageId, msg));
      }
      normalizedIncoming.forEach(msg => map.set(msg.messageId, msg));
      return Array.from(map.values()).sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
    });
  }, [normalizeMessage]);

  const normalizeHubMessage = useCallback((raw: any): ChatMessage | null => {
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
  }, [currentUserId, normalizeMessage, numericConversationId]);

  const parseApiResponse = <T,>(res: any): T | null => {
    if (!res) return null;
    if (res?.data?.data !== undefined) return res.data.data as T;
    if (res?.data !== undefined) return res.data as T;
    return res as T;
  };

  const loadConversation = useCallback(async () => {
    if (!hasValidId) return;
    try {
      const res = await getConversation(numericConversationId);
      const data = parseApiResponse<ChatConversation>(res);
      if (data) setConversation(data);
    } catch (e: any) {
      console.error('Failed to fetch conversation', e);
      setError(e?.message || 'تعذر تحميل تفاصيل المحادثة.');
    }
  }, [hasValidId, numericConversationId]);

  const loadMessages = useCallback(async (targetPage: number, { replace }: { replace: boolean }) => {
    if (!hasValidId) return;
    if (targetPage > 1) {
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
    }
  }, [hasValidId, numericConversationId, upsertMessages]);

  const initialize = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([loadConversation(), loadMessages(1, { replace: true })]);
  }, [loadConversation, loadMessages]);

  useEffect(() => {
    initialize();
  }, [initialize]);

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

        const connection = builder.withAutomaticReconnect().build();

        connection.on('MessageCreated', (payload: any) => {
          if (!isMounted || !payload) return;
          const normalized = normalizeHubMessage(payload);
          if (normalized) {
            upsertMessages([normalized]);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }
        });

        connection.onreconnected(() => {
          connection.invoke('JoinConversation', numericConversationId).catch(() => {});
          loadMessages(1, { replace: false }).catch(() => {});
        });

        await connection.start();
        if (!isMounted) {
          await connection.stop();
          return;
        }
        connectionRef.current = connection;
        setConnected(true);
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
        conn.stop().catch(() => {});
      }
      setConnected(false);
    };
  }, [hasValidId, loadMessages, normalizeHubMessage, numericConversationId, upsertMessages]);

  const handleSend = useCallback(async () => {
    if (!hasValidId || !inputValue.trim() || !currentUserId) return;
    
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
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e: any) {
      console.error('Failed to send message', e);
      setError(e?.message || 'تعذر إرسال الرسالة.');
    } finally {
      setSending(false);
    }
  }, [currentUserId, hasValidId, inputValue, numericConversationId, upsertMessages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!hasValidId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-20 px-8">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-10 text-center">
            <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <svg className="w-14 h-14 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">خطأ في المحادثة</h2>
            <p className="text-gray-600 mb-6">معرف المحادثة غير صالح أو غير موجود</p>
            <button
              onClick={() => navigate('/messages')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              العودة للمحادثات
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/messages')}
              className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {conversation?.contextType ? `محادثة ${conversation.contextType}` : 'المحادثة'}
              </h1>
              {conversation?.contextId && (
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-xs text-gray-500">#{conversation.contextId}</span>
                </div>
              )}
            </div>
          </div>
          {connectingSocket && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium">جاري الاتصال...</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && !loading && (
        <div className="max-w-5xl mx-auto w-full px-6 py-3">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-700">{error}</span>
            </div>
            <button
              onClick={initialize}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      )}

      {/* Conversation Info */}
      {conversation && (
        <div className="max-w-5xl mx-auto w-full px-6 py-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">نوع السياق:</span>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg">{conversation.contextType}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">معرّف السياق:</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg">{conversation.contextId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">الحالة:</span>
                <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-semibold rounded-lg">{conversation.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {loading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500">جاري التحميل...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">لا توجد رسائل</h3>
              <p className="text-gray-500">ابدأ محادثتك الآن بكتابة رسالة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(msg => {
                const isMine = currentUserId != null && msg.senderUserId === currentUserId;
                const isSystem = msg.isSystem;

                if (isSystem) {
                  return (
                    <div key={msg.messageId} className="flex flex-col items-center my-6">
                      <div className="px-4 py-2 bg-gray-100 rounded-full max-w-md">
                        <p className="text-xs text-gray-600 text-center">{msg.body}</p>
                      </div>
                      <span className="text-xs text-gray-400 mt-1">{formatTimestamp(msg.sentAt)}</span>
                    </div>
                  );
                }

                return (
                  <div key={msg.messageId} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md ${isMine ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          isMine
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm leading-6">{msg.body}</p>
                      </div>
                      <span className={`text-xs text-gray-400 mt-1 block ${isMine ? 'text-right' : 'text-left'}`}>
                        {formatTimestamp(msg.sentAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-end gap-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="اكتب رسالتك..."
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none resize-none text-right"
            rows={1}
            style={{ minHeight: '50px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !inputValue.trim()}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              sending || !inputValue.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg'
            }`}
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

