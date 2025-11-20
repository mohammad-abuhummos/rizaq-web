import { Link, useLocation } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { useState, useRef, useEffect, useCallback } from "react";
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';
import { listUserConversations, type ChatConversationSummary } from '~/lib/services/chat';
import { getAuthUser } from '~/lib/storage/auth-storage';

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const formatRelativeTime = useCallback((iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';

    const diff = Date.now() - date.getTime();
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

    const days = Math.floor(diff / day);
    return days <= 1 ? 'أمس' : `قبل ${days} أيام`;
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoadingChats(true);
    try {
      const auth = await getAuthUser<{ userId?: number; id?: number }>();
      const userId = auth?.userId ?? auth?.id;
      
      if (!userId) return;

      const res = await listUserConversations(Number(userId));
      const raw = (res as any)?.data ?? res;
      const nested = (raw as any)?.data ?? raw;
      const items = Array.isArray(nested) ? nested : Array.isArray(raw) ? raw : [];

      // Sort by most recent and take top 3
      const sorted = items.sort((a: ChatConversationSummary, b: ChatConversationSummary) => {
        const aTime = new Date(a.lastMessageAt || a.updatedAt || a.openedAt).getTime();
        const bTime = new Date(b.lastMessageAt || b.updatedAt || b.openedAt).getTime();
        return bTime - aTime;
      });

      setConversations(sorted.slice(0, 3));
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setLoadingChats(false);
    }
  }, [isAuthenticated]);

  // Fetch conversations when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      
      // Refresh every 30 seconds
      const interval = setInterval(fetchConversations, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchConversations]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-green-600 to-emerald-600 text-white shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Cairo, sans-serif' }}>
                Rizaq
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
              <Link
                to="/"
                className={`text-sm font-semibold transition-colors relative group ${isActive('/') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                  }`}
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                الرئيسية
                <span className={`absolute bottom-0 right-0 h-0.5 bg-green-600 transition-all duration-300 ${isActive('/') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
              </Link>
              <Link
                to="/auctions"
                className={`text-sm font-semibold transition-colors relative group ${isActive('/auctions') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                  }`}
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                المزادات
                <span className={`absolute bottom-0 right-0 h-0.5 bg-green-600 transition-all duration-300 ${isActive('/auctions') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
              </Link>
              <Link
                to="/tenders"
                className={`text-sm font-semibold transition-colors relative group ${isActive('/tenders') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                  }`}
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                المناقصات
                <span className={`absolute bottom-0 right-0 h-0.5 bg-green-600 transition-all duration-300 ${isActive('/tenders') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
              </Link>
              <Link
                to="/direct-selling"
                className={`text-sm font-semibold transition-colors relative group ${isActive('/direct-selling') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                  }`}
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                البيع المباشر
                <span className={`absolute bottom-0 right-0 h-0.5 bg-green-600 transition-all duration-300 ${isActive('/direct-selling') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
              </Link>
              <Link
                to="/transport"
                className={`text-sm font-semibold transition-colors relative group ${isActive('/transport') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                  }`}
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                النقل
                <span className={`absolute bottom-0 right-0 h-0.5 bg-green-600 transition-all duration-300 ${isActive('/transport') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
              </Link>
            </nav>

            {/* Auth Buttons / User Menu */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              {isAuthenticated ? (
                <>
                  {/* Notifications Dropdown */}
                  <Menu as="div" className="relative hidden md:block">
                    <Menu.Button className="relative p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                      <BellIcon className="h-6 w-6" />
                      {/* Notification Badge */}
                      <span className="absolute top-1 right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center">
                          <span className="text-white text-[10px] font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>3</span>
                        </span>
                      </span>
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute left-0 rtl:right-0 mt-2 w-80 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                        <div className="p-4 border-b border-gray-200">
                          <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Cairo, sans-serif' }}>الإشعارات</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {/* Sample Notifications */}
                          <Menu.Item>
                            {({ active }) => (
                              <div className={`px-4 py-3 ${active ? 'bg-gray-50' : ''} cursor-pointer border-b border-gray-100`}>
                                <div className="flex gap-3">
                                  <div className="shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                      <BellIcon className="h-5 w-5 text-green-600" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                      مزاد جديد
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                      تم إضافة مزاد جديد في فئة المنتجات الزراعية
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                      منذ ساعتين
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <div className={`px-4 py-3 ${active ? 'bg-gray-50' : ''} cursor-pointer border-b border-gray-100`}>
                                <div className="flex gap-3">
                                  <div className="shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                      رسالة جديدة
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                      لديك رسالة جديدة من أحمد محمد
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                      منذ 5 ساعات
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <div className={`px-4 py-3 ${active ? 'bg-gray-50' : ''} cursor-pointer`}>
                                <div className="flex gap-3">
                                  <div className="shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                      <BellIcon className="h-5 w-5 text-yellow-600" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                      تحديث المناقصة
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                      تم تحديث موعد نهاية المناقصة رقم #12345
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                      منذ يوم واحد
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Menu.Item>
                        </div>
                        <div className="p-3 border-t border-gray-200">
                          <Link
                            to="/notifications"
                            className="block text-center text-sm font-semibold text-green-600 hover:text-green-700"
                            style={{ fontFamily: 'Cairo, sans-serif' }}
                          >
                            عرض جميع الإشعارات
                          </Link>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>

                  {/* Chat Dropdown */}
                  <Menu as="div" className="relative hidden md:block">
                    <Menu.Button 
                      className="relative p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={fetchConversations}
                    >
                      <ChatBubbleLeftRightIcon className="h-6 w-6" />
                      {/* Message Badge */}
                      {conversations.length > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4">
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 items-center justify-center">
                            <span className="text-white text-[10px] font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                              {conversations.filter(c => (c.unreadCount || 0) > 0).length || conversations.length}
                            </span>
                          </span>
                        </span>
                      )}
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute left-0 rtl:right-0 mt-2 w-80 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                        <div className="p-4 border-b border-gray-200">
                          <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Cairo, sans-serif' }}>المحادثات</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {loadingChats ? (
                            <div className="px-4 py-8 text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                              <p className="text-xs text-gray-500" style={{ fontFamily: 'Cairo, sans-serif' }}>جاري التحميل...</p>
                            </div>
                          ) : conversations.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                              <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <p className="text-sm text-gray-500" style={{ fontFamily: 'Cairo, sans-serif' }}>لا توجد محادثات</p>
                            </div>
                          ) : (
                            conversations.map((conversation, index) => {
                              // Better gradient colors
                              const gradientColors = [
                                'bg-gradient-to-br from-green-500 to-emerald-600',
                                'bg-gradient-to-br from-blue-500 to-indigo-600',
                                'bg-gradient-to-br from-purple-500 to-pink-600',
                              ];
                              const colorClass = gradientColors[index % gradientColors.length];
                              const firstLetter = conversation.counterpartName?.charAt(0) || conversation.contextType?.charAt(0) || 'م';
                              const title = conversation.counterpartName || `محادثة ${conversation.contextType}`;
                              const preview = conversation.lastMessageBody?.substring(0, 50) || 'لا توجد رسائل';
                              const timeSource = conversation.lastMessageAt || conversation.updatedAt || conversation.openedAt;
                              const hasUnread = (conversation.unreadCount || 0) > 0;

                              return (
                                <Menu.Item key={conversation.conversationId}>
                                  {({ active }) => (
                                    <Link
                                      to={`/chat/${conversation.conversationId}`}
                                      className={`block px-4 py-3 ${active ? 'bg-gray-50' : ''} ${hasUnread ? 'bg-blue-50' : ''} ${index < conversations.length - 1 ? 'border-b border-gray-100' : ''}`}
                                    >
                                      <div className="flex gap-3">
                                        <div className="shrink-0 relative">
                                          <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center text-white font-bold text-sm shadow-md`} style={{ fontFamily: 'Cairo, sans-serif' }}>
                                            {firstLetter}
                                          </div>
                                          {hasUnread && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                              <span className="text-white text-[10px] font-bold">{conversation.unreadCount}</span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-gray-900 truncate" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                              {title}
                                            </p>
                                            <span className="text-xs text-gray-400 mr-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                              {formatRelativeTime(timeSource)}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-600 mt-1 truncate" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                            {preview}
                                          </p>
                                        </div>
                                      </div>
                                    </Link>
                                  )}
                                </Menu.Item>
                              );
                            })
                          )}
                        </div>
                        <div className="p-3 border-t border-gray-200">
                          <Link
                            to="/messages"
                            className="block text-center text-sm font-semibold text-green-600 hover:text-green-700"
                            style={{ fontFamily: 'Cairo, sans-serif' }}
                          >
                            عرض جميع المحادثات
                          </Link>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>

                  {/* User Menu */}
                </>
              ) : null}
              {isAuthenticated ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white font-bold text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <span className="hidden sm:block text-sm font-semibold text-gray-700" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      {user?.fullName || 'المستخدم'}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div className="absolute left-0 rtl:right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <Link
                        to="/account"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        style={{ fontFamily: 'Cairo, sans-serif' }}
                        onClick={() => setShowUserMenu(false)}
                      >
                        حسابي
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        style={{ fontFamily: 'Cairo, sans-serif' }}
                      >
                        تسجيل الخروج
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                    style={{ fontFamily: 'Cairo, sans-serif' }}
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-5 py-2.5 text-sm font-bold text-white bg-linear-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    style={{ fontFamily: 'Cairo, sans-serif' }}
                  >
                    إنشاء حساب
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Matching Mobile App */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-lg" style={{ borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
        <div className="grid grid-cols-4 h-16 px-2">

          {/* Account */}
          <Link
            to="/account"
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive('/account') ? 'text-green-500' : 'text-gray-400'
              }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[11px] font-semibold" style={{ fontFamily: 'Cairo, sans-serif' }}>الحسابات</span>
          </Link>

          {/* Notifications */}
          <Link
            to="/notifications"
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors relative ${isActive('/notifications') ? 'text-green-500' : 'text-gray-400'
              }`}
          >
            <div className="relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Notification Badge */}
              <div className="absolute -top-1 -right-2 bg-red-500 rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                <span className="text-white text-[10px] font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>0</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold" style={{ fontFamily: 'Cairo, sans-serif' }}>الاشعارات</span>
          </Link>

          {/* Messages */}
          <Link
            to="/messages"
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive('/messages') ? 'text-green-500' : 'text-gray-400'
              }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-[11px] font-semibold" style={{ fontFamily: 'Cairo, sans-serif' }}>المحادثات</span>
          </Link>

          {/* Home */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive('/') ? 'text-green-500' : 'text-gray-400'
              }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[11px] font-semibold" style={{ fontFamily: 'Cairo, sans-serif' }}>الرئيسية</span>
          </Link>

        </div>
      </nav>

      {/* Mobile Bottom Nav Spacer */}
      <div className="md:hidden h-16"></div>
    </>
  );
}

