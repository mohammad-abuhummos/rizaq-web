import { useState, useEffect } from 'react';
import { requestNotificationPermission, getFCMToken } from '~/lib/services/fcm';
import { registerDevice } from '~/lib/services/notification';
import { getAuthUser } from '~/lib/storage/auth-storage';

interface NotificationPermissionPromptProps {
  trigger?: 'auction' | 'chat' | 'home';
  onPermissionGranted?: () => void;
  onDismiss?: () => void;
}

const PROMPT_STORAGE_KEY = 'notification_prompt_dismissed';
const PROMPT_COUNT_KEY = 'notification_prompt_count';
const MAX_PROMPTS = 3; // Show prompt maximum 3 times

export function NotificationPermissionPrompt({ 
  trigger = 'home',
  onPermissionGranted,
  onDismiss 
}: NotificationPermissionPromptProps) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    const shouldShow = async () => {
      // Don't show if not in browser
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return false;
      }

      // Don't show if already granted
      if (Notification.permission === 'granted') {
        return false;
      }

      // Don't show if explicitly denied
      if (Notification.permission === 'denied') {
        return false;
      }

      // Check if dismissed recently
      const dismissed = localStorage.getItem(PROMPT_STORAGE_KEY);
      if (dismissed) {
        const dismissTime = parseInt(dismissed, 10);
        const hoursSinceDismiss = (Date.now() - dismissTime) / (1000 * 60 * 60);
        
        // Don't show again within 24 hours
        if (hoursSinceDismiss < 24) {
          return false;
        }
      }

      // Check prompt count
      const countStr = localStorage.getItem(PROMPT_COUNT_KEY);
      const count = countStr ? parseInt(countStr, 10) : 0;
      
      // Don't show if we've already prompted MAX_PROMPTS times
      if (count >= MAX_PROMPTS) {
        return false;
      }

      return true;
    };

    shouldShow().then(should => {
      if (should) {
        // Show prompt after a short delay
        setTimeout(() => setShow(true), 2000);
      }
    });
  }, [trigger]);

  const handleEnable = async () => {
    setLoading(true);

    try {
      // Request permission
      const granted = await requestNotificationPermission();

      if (granted) {
        // Get FCM token
        const token = await getFCMToken();

        if (token) {
          // Get user ID
          const auth = await getAuthUser<{ userId?: number; id?: number }>();
          const userId = auth?.userId ?? auth?.id;

          if (userId) {
            // Register device
            await registerDevice(userId);
          }
        }

        // Increment prompt count
        const countStr = localStorage.getItem(PROMPT_COUNT_KEY);
        const count = countStr ? parseInt(countStr, 10) : 0;
        localStorage.setItem(PROMPT_COUNT_KEY, String(count + 1));

        setShow(false);
        onPermissionGranted?.();
      } else {
        // Permission denied
        handleDismiss();
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      handleDismiss();
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    // Store dismiss timestamp
    localStorage.setItem(PROMPT_STORAGE_KEY, String(Date.now()));

    // Increment prompt count
    const countStr = localStorage.getItem(PROMPT_COUNT_KEY);
    const count = countStr ? parseInt(countStr, 10) : 0;
    localStorage.setItem(PROMPT_COUNT_KEY, String(count + 1));

    setShow(false);
    onDismiss?.();
  };

  const getMessage = () => {
    switch (trigger) {
      case 'auction':
        return {
          title: 'تابع المزادات',
          description: 'احصل على إشعارات فورية عند تحديثات المزادات والعروض الجديدة',
          icon: '🔨',
        };
      case 'chat':
        return {
          title: 'لا تفوت رسالة',
          description: 'احصل على إشعارات فورية عند وصول رسائل جديدة من المشترين والبائعين',
          icon: '💬',
        };
      default:
        return {
          title: 'ابق على اطلاع',
          description: 'احصل على إشعارات فورية للمزادات والرسائل والتحديثات المهمة',
          icon: '🔔',
        };
    }
  };

  if (!show) {
    return null;
  }

  const message = getMessage();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-center">
          <div className="text-6xl mb-3">{message.icon}</div>
          <h2 className="text-2xl font-bold text-white mb-2">{message.title}</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-center leading-relaxed mb-6">
            {message.description}
          </p>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-600">تحديثات فورية للمزادات</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-600">إشعارات الرسائل الجديدة</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-600">تنبيهات المناقصات والعروض</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>جاري التفعيل...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>تفعيل الإشعارات</span>
                </>
              )}
            </button>

            <button
              onClick={handleDismiss}
              disabled={loading}
              className="w-full py-3 text-gray-600 hover:text-gray-800 font-semibold transition-colors disabled:opacity-50"
            >
              ليس الآن
            </button>
          </div>

          {/* Privacy note */}
          <p className="text-xs text-gray-400 text-center mt-4">
            يمكنك إيقاف الإشعارات في أي وقت من إعدادات المتصفح
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}

