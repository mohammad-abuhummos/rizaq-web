import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '~/components/Header';
import {
  type StoredNotification,
  getStoredNotifications,
  markNotificationAsRead,
  removeNotification,
  clearNotifications,
  resolveNavigationParams,
} from '~/lib/services/notification';

const getNotificationIcon = (action?: StoredNotification['action']) => {
  if (action?.type === 'navigate') {
    if (action.route.includes('auction')) {
      return 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z';
    }
    if (action.route.includes('tender')) {
      return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    }
    if (action.route.includes('order') || action.route.includes('direct')) {
      return 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z';
    }
    if (action.route.includes('chat') || action.route.includes('message')) {
      return 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z';
    }
  }

  return 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9';
};

const getNotificationColor = (action?: StoredNotification['action']) => {
  if (action?.type === 'navigate') {
    if (action.route.includes('auction')) return '#3B82F6';
    if (action.route.includes('tender')) return '#10B981';
    if (action.route.includes('order') || action.route.includes('direct')) return '#F59E0B';
    if (action.route.includes('chat') || action.route.includes('message')) return '#8B5CF6';
  }

  return '#6B7280';
};

const formatTimeSince = (iso: string) => {
  const createdAt = new Date(iso);
  const diffMs = Date.now() - createdAt.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'الآن';

  if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute);
    if (minutes === 1) return 'منذ دقيقة واحدة';
    if (minutes < 10) return `منذ ${minutes} دقائق`;
    return `منذ ${minutes} دقيقة`;
  }

  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    if (hours === 1) return 'منذ ساعة واحدة';
    if (hours < 10) return `منذ ${hours} ساعات`;
    return `منذ ${hours} ساعة`;
  }

  return createdAt.toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);

  const loadNotifications = useCallback(() => {
    setLoading(true);
    const stored = getStoredNotifications();
    setNotifications(stored);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleClearNotifications = useCallback(() => {
    clearNotifications();
    setNotifications([]);
  }, []);

  const handleNotificationPress = useCallback((notification: StoredNotification) => {
    markNotificationAsRead(notification.id);
    setNotifications(prev =>
      prev.map(item => (item.id === notification.id ? { ...item, read: true } : item))
    );

    const target = resolveNavigationParams(notification.action);
    if (target) {
      navigate(target.route);
    }
  }, [navigate]);

  const handleDeleteNotification = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeNotification(id);
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />

      <div className="w-full px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">الإشعارات</h1>
            <p className="text-gray-600">جميع التحديثات والإشعارات الخاصة بك</p>
          </div>
          {notifications.length > 0 && !loading && (
            <button
              onClick={handleClearNotifications}
              className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              مسح الكل
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500">جاري تحميل الإشعارات...</p>
          </div>
        )}

        {/* Notifications List */}
        {!loading && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map(notification => (
              <button
                key={notification.id}
                onClick={() => handleNotificationPress(notification)}
                className={`w-full text-right p-4 rounded-xl border transition-all hover:shadow-md ${
                  notification.read
                    ? 'bg-white border-gray-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${getNotificationColor(notification.action)}15` }}
                  >
                    <svg
                      className="w-6 h-6"
                      style={{ color: getNotificationColor(notification.action) }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={getNotificationIcon(notification.action)}
                      />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-bold text-gray-900 truncate pr-2">
                        {notification.title}
                      </h3>
                      <button
                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold px-2"
                      >
                        حذف
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {formatTimeSince(notification.createdAt)}
                      </span>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-6 w-32 h-32 rounded-full bg-gray-50 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-14 h-14 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">لا توجد إشعارات</h2>
            <p className="text-gray-500 mb-2 text-center max-w-md">
              ليس لديك أي إشعارات في الوقت الحالي
            </p>
            <p className="text-sm text-gray-400 text-center max-w-md">
              عندما تتلقى إشعارات جديدة، ستظهر هنا
            </p>

            <div className="mt-10 flex gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-200"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <div className="w-2 h-2 rounded-full bg-gray-200"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

