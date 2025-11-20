import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { Header } from '~/components/Header';
import { listUserConversations } from '~/lib/services/chat';
import type { ChatConversationSummary } from '~/lib/services/chat';
import { getAuthUser } from '~/lib/storage/auth-storage';
import { NotificationPermissionPrompt } from '~/components/NotificationPermissionPrompt';
import { useAutoRegisterDevice } from '~/hooks/useAutoRegisterDevice';

const STATUS_STYLES: Record<string, { label: string; color: string; background: string }> = {
  open: { label: 'مفتوحة', color: '#16A34A', background: '#DCFCE7' },
  active: { label: 'نشطة', color: '#10B981', background: '#D1FAE5' },
  pending: { label: 'قيد الانتظار', color: '#F97316', background: '#FFEDD5' },
  closed: { label: 'مغلقة', color: '#DC2626', background: '#FEE2E2' },
  archived: { label: 'مؤرشفة', color: '#6B7280', background: '#E5E7EB' },
};

const CONTEXT_STYLES: Record<string, { label: string; icon: string; color: string; background: string }> = {
  direct: { label: 'محادثة مباشرة', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: '#3B82F6', background: '#EFF6FF' },
  order: { label: 'طلب مباشر', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', color: '#2563EB', background: '#DBEAFE' },
  auction: { label: 'محادثة مزاد', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: '#F59E0B', background: '#FEF3C7' },
  tender: { label: 'مناقصة', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: '#10B981', background: '#D1FAE5' },
  logistics: { label: 'خدمات نقل', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4', color: '#6366F1', background: '#EEF2FF' },
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
    return { label: 'محادثة', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: '#3B82F6', background: '#EFF6FF' };
  }
  const key = context.toLowerCase();
  return CONTEXT_STYLES[key] ?? {
    label: context,
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    color: '#3B82F6',
    background: '#EFF6FF',
  };
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

export default function MessagesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);

  // Auto-register device when permission is granted
  useAutoRegisterDevice();

  const fetchConversations = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const sortedConversations = [...conversations].sort((a, b) => getComparableDate(b) - getComparableDate(a));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      {/* Notification Permission Prompt */}
      <NotificationPermissionPrompt trigger="chat" />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">المحادثات</h1>
          <p className="text-gray-600">عرض أحدث المحادثات عبر مختلف الخدمات</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500">جاري تحميل المحادثات...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-lg text-red-600 text-center mb-6">{error}</p>
            <button
              onClick={fetchConversations}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Conversations List */}
        {!loading && !error && sortedConversations.length > 0 && (
          <div className="space-y-4">
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
              const subtitle = subtitleParts.join(' • ');
              const preview = conversation.lastMessageBody?.trim()
                ? conversation.lastMessageBody
                : 'لا توجد رسائل بعد في هذه المحادثة.';
              const timeSource = conversation.lastMessageAt || conversation.updatedAt || conversation.openedAt;
              const relativeTime = formatRelativeTime(timeSource);
              const exactTime = formatFullDate(timeSource);

              return (
                <Link
                  key={conversation.conversationId}
                  to={`/chat/${conversation.conversationId}`}
                  className="block p-5 rounded-2xl border border-gray-200 bg-white hover:shadow-lg hover:border-blue-200 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 relative"
                      style={{ backgroundColor: context.background }}
                    >
                      <svg className="w-7 h-7" style={{ color: context.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={context.icon} />
                      </svg>
                      {unread > 0 && (
                        <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{unread}</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{context.label}</h3>
                        <span className="text-xs text-gray-400 mr-3">{relativeTime}</span>
                      </div>

                      {subtitle && (
                        <p className="text-sm text-gray-500 mb-2 truncate">{subtitle}</p>
                      )}

                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{preview}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">رقم المحادثة: {conversation.conversationId}</span>
                        <div
                          className="px-3 py-1 rounded-full"
                          style={{ backgroundColor: status.background }}
                        >
                          <span className="text-xs font-semibold" style={{ color: status.color }}>
                            {status.label}
                          </span>
                        </div>
                      </div>

                      {exactTime && (
                        <p className="text-xs text-gray-400 mt-2">{exactTime}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && sortedConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-6 w-28 h-28 rounded-full bg-gray-50 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد محادثات بعد</h3>
            <p className="text-gray-500 text-center max-w-md leading-6 mb-4">
              عندما تبدأ تواصلك مع المشترين أو البائعين ستظهر محادثاتك هنا.
            </p>
            <p className="text-sm text-gray-400 text-center max-w-md">
              يمكنك فتح محادثة جديدة من صفحات الطلبات أو المزادات.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

