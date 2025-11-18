import { Link, useLocation } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
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

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
            <Link
              to="/"
              className={`text-sm font-semibold transition-colors relative group ${
                isActive('/') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              الرئيسية
              <span className={`absolute bottom-0 right-0 h-0.5 bg-green-600 transition-all duration-300 ${
                isActive('/') ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </Link>
            <Link
              to="/auctions"
              className={`text-sm font-semibold transition-colors relative group ${
                isActive('/auctions') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              المزادات
              <span className={`absolute bottom-0 right-0 h-0.5 bg-green-600 transition-all duration-300 ${
                isActive('/auctions') ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </Link>
            <Link
              to="/tenders"
              className={`text-sm font-semibold transition-colors relative group ${
                isActive('/tenders') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              المناقصات
              <span className={`absolute bottom-0 right-0 h-0.5 bg-green-600 transition-all duration-300 ${
                isActive('/tenders') ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </Link>
            <Link
              to="/direct-selling"
              className={`text-sm font-semibold transition-colors relative group ${
                isActive('/direct-selling') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              البيع المباشر
              <span className={`absolute bottom-0 right-0 h-0.5 bg-green-600 transition-all duration-300 ${
                isActive('/direct-selling') ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </Link>
            <Link
              to="/transport"
              className={`text-sm font-semibold transition-colors relative group ${
                isActive('/transport') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              النقل
              <span className={`absolute bottom-0 right-0 h-0.5 bg-green-600 transition-all duration-300 ${
                isActive('/transport') ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </Link>
          </nav>

          {/* Auth Buttons / User Menu */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white font-bold text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
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
                  className="inline-flex items-center px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
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
  );
}

