import type { Route } from "./+types/home";
import { useState, useCallback } from "react";
import { Header } from "../components/Header";
import { BannerCarousel, type Banner } from "../components/home/BannerCarousel";
import { SearchBar } from "../components/home/SearchBar";
import { CategoryButtons } from "../components/home/CategoryButtons";
import { HomeTabs } from "../components/home/HomeTabs";
import { ServicesCardContainer } from "../components/home/ServicesCardContainer";
import { PromoCard } from "../components/home/PromoCard";
import { NotificationPermissionPrompt } from "../components/NotificationPermissionPrompt";
import { useAutoRegisterDevice } from "../hooks/useAutoRegisterDevice";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Rizaq - Agricultural Marketplace" },
    {
      name: "description",
      content: "Connect farmers, traders, and transporters in one platform",
    },
  ];
}

const dummyBanners: Banner[] = [
  {
    id: "1",
    image:
      "https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "أسعار خيال",
    subtitle: "اشتري او بيع الآن",
    buttonLabel: "سجل الآن",
  },
  {
    id: "2",
    image:
      "https://images.pexels.com/photos/1487511/pexels-photo-1487511.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "مزادات يومية",
    subtitle: "اشتري او بيع الآن",
    buttonLabel: "شارك الآن",
  },
  {
    id: "3",
    image:
      "https://images.pexels.com/photos/2733918/pexels-photo-2733918.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "منتجات طازجة",
    subtitle: "اشتري او بيع الآن",
    buttonLabel: "اطلب الآن",
  },
];

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<{
    categoryId: number | null;
    keywords: string[];
    isActive: boolean;
  }>({
    categoryId: null,
    keywords: [],
    isActive: false,
  });

  // Auto-register device when permission is granted
  useAutoRegisterDevice();

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleCategoryChange = useCallback((categoryId: number | null, keywords: string[]) => {
    setCategoryFilter({
      categoryId,
      keywords,
      isActive: !!categoryId,
    });
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleBannerPress = (bannerId: string) => {
    console.log("Banner pressed:", bannerId);
    // TODO: Navigate to banner details or action
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header />
      
      {/* Notification Permission Prompt */}
      <NotificationPermissionPrompt trigger="home" />

      {/* Main Layout with Sidebar */}
      <div className="w-full px-4 py-6 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 space-y-6 order-2 lg:order-1">

            {/* Categories - Mobile and Tablet */}
            <div className="lg:hidden overflow-x-auto">
              <CategoryButtons onCategoryChange={handleCategoryChange} />
            </div>

            {/* Banner Carousel */}
            <div className="rounded-2xl overflow-hidden shadow-sm">
              <BannerCarousel data={dummyBanners} onBannerPress={handleBannerPress} />
            </div>

            {/* Categories - Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <CategoryButtons onCategoryChange={handleCategoryChange} />
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="group bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-gray-100 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-50 to-transparent rounded-bl-full -mr-6 -mt-6 opacity-60 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">150+</p>
                    <p className="text-xs font-medium text-gray-500">مزاد نشط</p>
                  </div>
                </div>
              </div>

              <div className="group bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-gray-100 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-50 to-transparent rounded-bl-full -mr-6 -mt-6 opacity-60 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">85+</p>
                    <p className="text-xs font-medium text-gray-500">مناقصة متاحة</p>
                  </div>
                </div>
              </div>

              <div className="group bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-gray-100 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-6 -mt-6 opacity-60 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">320+</p>
                    <p className="text-xs font-medium text-gray-500">منتج للبيع</p>
                  </div>
                </div>
              </div>

              <div className="group bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-gray-100 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-50 to-transparent rounded-bl-full -mr-6 -mt-6 opacity-60 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 group-hover:text-orange-700 transition-colors">5.2K+</p>
                    <p className="text-xs font-medium text-gray-500">مستخدم</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Sections */}
            <HomeTabs
              refreshKey={refreshKey}
              categoryFilter={categoryFilter}
              searchQuery={searchQuery}
            />

            {/* Services Section */}
            <div className="pt-4">
              <ServicesCardContainer />
            </div>

            {/* Promo Card */}
            <PromoCard />
          </div>

          {/* Sticky Sidebar - Right Side */}
          <div className="w-full lg:w-80 lg:flex-shrink-0 order-1 lg:order-2">
            <div className="lg:sticky lg:top-6 space-y-4 w-full">

              {/* Modern Search & Filter Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">البحث والتصفية</h3>
                      <p className="text-xs text-gray-600">ابحث عن ما تريد</p>
                    </div>
                  </div>
                </div>

                {/* Search Section */}
                <div className="px-4 pt-4 pb-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    البحث عن المنتجات
                  </label>
                </div>
                <div className="pb-4 mx-0">
                  <SearchBar
                    onSearch={handleSearch}
                    placeholder="ابحث عن الصنف..."
                    onSearchPress={() => console.log("Search button pressed")}
                  />
                </div>

                {/* Footer with Quick Stats */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      تحديث مباشر
                    </span>
                    <span className="font-semibold text-gray-700">555+ عرض متاح</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  إجراءات سريعة
                </h3>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between">
                    <span>إنشاء مزاد جديد</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="w-full px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between">
                    <span>إضافة مناقصة</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="w-full px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between">
                    <span>بيع مباشر</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
