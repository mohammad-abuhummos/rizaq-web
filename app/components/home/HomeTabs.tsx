import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { getOpenAuctions } from '~/lib/services/auction';
import { listOpenTenders } from '~/lib/services/tender';
import { listDirectListings } from '~/lib/services/direct';
import type { OpenAuction } from '~/lib/types/auction';
import type { Tender } from '~/lib/types/tender';
import type { DirectListing } from '~/lib/types/direct';
import { EmptyPlaceholder } from './EmptyPlaceholder';

// Countdown Timer Component
function CountdownTimer({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 px-4 py-2.5 rounded-xl shadow-lg">
      <svg className="w-5 h-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="flex items-center gap-1.5 text-white font-bold text-sm">
        <div className="flex flex-col items-center">
          <span className="text-lg leading-none">{formatNumber(timeLeft.days)}</span>
          <span className="text-[10px] opacity-90">يوم</span>
        </div>
        <span className="text-lg">:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg leading-none">{formatNumber(timeLeft.hours)}</span>
          <span className="text-[10px] opacity-90">ساعة</span>
        </div>
        <span className="text-lg">:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg leading-none">{formatNumber(timeLeft.minutes)}</span>
          <span className="text-[10px] opacity-90">دقيقة</span>
        </div>
        <span className="text-lg">:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg leading-none">{formatNumber(timeLeft.seconds)}</span>
          <span className="text-[10px] opacity-90">ثانية</span>
        </div>
      </div>
    </div>
  );
}

interface CategoryFilterState {
  categoryId: number | null;
  keywords: string[];
  isActive: boolean;
}

interface HomeTabsProps {
  refreshKey: number;
  categoryFilter: CategoryFilterState;
  searchQuery: string;
}

export function HomeTabs({ refreshKey, categoryFilter, searchQuery }: HomeTabsProps) {
  const [auctions, setAuctions] = useState<OpenAuction[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [listings, setListings] = useState<DirectListing[]>([]);
  const [loading, setLoading] = useState(true);
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Prevent multiple simultaneous API calls
    if (isLoadingRef.current) {
      return;
    }

    const loadData = async () => {
      isLoadingRef.current = true;
      if (isMountedRef.current) {
        setLoading(true);
      }

      try {
        const [auctionsRes, tendersRes, listingsRes] = await Promise.all([
          getOpenAuctions().catch(() => ({ data: [] })),
          listOpenTenders().catch(() => ({ data: [] })),
          listDirectListings().catch(() => ({ data: [] })),
        ]);

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setAuctions(Array.isArray(auctionsRes.data) ? auctionsRes.data.slice(0, 3) : []);
          setTenders(Array.isArray(tendersRes.data) ? tendersRes.data.slice(0, 3) : []);
          setListings(Array.isArray(listingsRes.data) ? listingsRes.data.slice(0, 3) : []);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        if (isMountedRef.current) {
          setLoading(false);
        }
      } finally {
        isLoadingRef.current = false;
      }
    };

    loadData();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="px-4 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="py-2 space-y-8">
      {/* Auctions Tab */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">المزادات</h3>
          <Link to="/auctions" className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors flex items-center gap-1">
            عرض الكل
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </div>
        {auctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => {
              const cardColor = auction.productCardColor || '#10B981';
              const mainImage = auction.productMainImage || (auction.images && auction.images[0]);
              const currentPrice = auction.currentPrice || auction.startingPrice;
              const priceIncrease = currentPrice > auction.startingPrice
                ? ((currentPrice - auction.startingPrice) / auction.startingPrice * 100).toFixed(1)
                : '0';

              return (
                <Link
                  key={auction.auctionId}
                  to={`/auctions/${auction.auctionId}`}
                  className="group relative bg-white rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                  style={{
                    boxShadow: `0 4px 20px ${cardColor}20`,
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}
                >
                  {/* Image Section with Overlay Gradient */}
                  <div className="relative h-56 overflow-hidden">
                    {mainImage ? (
                      <>
                        <img
                          src={mainImage}
                          alt={auction.auctionTitle}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
                        />
                      </>
                    ) : (
                      <EmptyPlaceholder type="auction" />
                    )}

                    {/* Status Badge */}
                    <div
                      className="absolute top-4 right-4 px-4 py-2 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2"
                      style={{
                        backgroundColor: `${cardColor}`,
                        boxShadow: `0 8px 16px ${cardColor}40`
                      }}
                    >
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-xs text-white font-bold tracking-wide">مزاد مفتوح</span>
                    </div>

                    {/* Price Increase Badge */}
                    {parseFloat(priceIncrease) > 0 && (
                      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 shadow-xl backdrop-blur-md">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-white font-bold">+{priceIncrease}%</span>
                        </div>
                      </div>
                    )}

                    {/* Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h4 className="text-xl font-bold text-white drop-shadow-lg line-clamp-2 mb-1">
                        {auction.auctionTitle || 'مزاد زراعي'}
                      </h4>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-5 space-y-4">
                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed min-h-[40px]">
                      {auction.auctionDescription || 'لا يوجد وصف متاح'}
                    </p>

                    {/* Countdown Timer */}
                    <CountdownTimer endTime={auction.endTime} />

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                    {/* Price Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 font-medium mb-1">السعر الحالي</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold" style={{ color: cardColor }}>
                              {currentPrice.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-600 font-semibold">ل.س</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <span className="text-xs text-gray-500 font-medium mb-1">سعر البداية</span>
                          <span className="text-sm font-bold text-gray-700">
                            {auction.startingPrice.toLocaleString()} ل.س
                          </span>
                        </div>
                      </div>

                      {/* Increment Info */}
                      <div
                        className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                        style={{ backgroundColor: `${cardColor}08` }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${cardColor}15` }}
                          >
                            <svg className="w-4 h-4" style={{ color: cardColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500">الحد الأدنى للزيادة</span>
                            <span className="text-sm font-bold text-gray-800">
                              {auction.minIncrement.toLocaleString()} ل.س
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] flex items-center justify-center gap-2"
                      style={{
                        background: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 100%)`,
                      }}
                    >
                      <span>شاهد التفاصيل والمزايدة</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">لا توجد مزادات متاحة</p>
          </div>
        )}
      </div>

      {/* Tenders Tab */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">المناقصات</h3>
          <Link to="/tenders" className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors flex items-center gap-1">
            عرض الكل
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </div>
        {tenders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tenders.map((tender) => (
              <Link
                key={tender.tenderId}
                to={`/tenders/${tender.tenderId}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-purple-200 transition-all duration-300"
              >
                <div className="h-44 relative overflow-hidden rounded-t-2xl">
                  <EmptyPlaceholder type="tender" />
                  <div className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full shadow-lg backdrop-blur-sm">
                    <span className="text-xs text-white font-bold">مناقصة مفتوحة</span>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                    {tender.title || tender.cropName || 'مناقصة زراعية'}
                  </h4>
                  <p className="text-sm text-gray-500 mb-2">
                    الكمية: {tender.quantity?.toLocaleString() || '-'} {tender.unit || ''}
                  </p>
                  {tender.maxBudget && (
                    <span className="text-lg font-bold text-green-600">
                      {tender.maxBudget.toLocaleString()} ل.س
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 mb-4">
              <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">لا توجد مناقصات متاحة</p>
          </div>
        )}
      </div>

      {/* Live Sell Tab */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">البيع المباشر</h3>
          <Link to="/direct-selling" className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors flex items-center gap-1">
            عرض الكل
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </div>
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <Link
                key={listing.listingId}
                to={`/direct-selling/${listing.listingId}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300"
              >
                <div className="h-44 relative overflow-hidden rounded-t-2xl">
                  <EmptyPlaceholder type="listing" />
                  <div className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full shadow-lg backdrop-blur-sm">
                    <span className="text-xs text-white font-bold">بيع مباشر</span>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                    {listing.title || listing.cropName || 'عرض للبيع المباشر'}
                  </h4>
                  <p className="text-sm text-gray-500 mb-2">
                    الكمية المتاحة: {listing.availableQty?.toLocaleString() || '-'} {listing.unit || ''}
                  </p>
                  <span className="text-lg font-bold text-green-600">
                    {listing.unitPrice?.toLocaleString() || '-'} ل.س / {listing.unit || 'وحدة'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">لا توجد عروض بيع مباشر متاحة</p>
          </div>
        )}
      </div>
    </div>
  );
}

