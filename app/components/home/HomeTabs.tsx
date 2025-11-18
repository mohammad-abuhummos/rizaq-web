import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { getOpenAuctions } from '~/lib/services/auction';
import { listOpenTenders } from '~/lib/services/tender';
import { listDirectListings } from '~/lib/services/direct';
import type { OpenAuction } from '~/lib/types/auction';
import type { Tender } from '~/lib/types/tender';
import type { DirectListing } from '~/lib/types/direct';
import { EmptyPlaceholder } from './EmptyPlaceholder';

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
    <div className="px-4 py-2 space-y-8">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {auctions.map((auction) => (
              <Link
                key={auction.auctionId}
                to={`/auctions/${auction.auctionId}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-green-200 transition-all duration-300"
              >
                <div className="h-44 relative overflow-hidden rounded-t-2xl">
                  {auction.images && auction.images[0] ? (
                    <img
                      src={auction.images[0]}
                      alt={auction.auctionTitle}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <EmptyPlaceholder type="auction" />
                  )}
                  <div className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 rounded-full shadow-lg backdrop-blur-sm">
                    <span className="text-xs text-white font-bold">مزاد مفتوح</span>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                    {auction.auctionTitle || 'مزاد زراعي'}
                  </h4>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                    {auction.auctionDescription || ''}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600">
                      {auction.currentPrice?.toLocaleString() || auction.startingPrice.toLocaleString()} ل.س
                    </span>
                  </div>
                </div>
              </Link>
            ))}
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

