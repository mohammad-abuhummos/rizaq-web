import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { getOpenAuctions } from '~/lib/services/auction';
import { listOpenTenders } from '~/lib/services/tender';
import { listDirectListings } from '~/lib/services/direct';
import type { OpenAuction } from '~/lib/types/auction';
import type { Tender } from '~/lib/types/tender';
import type { DirectListing } from '~/lib/types/direct';
import { EmptyPlaceholder } from './EmptyPlaceholder';
import { AuctionCard } from './AuctionCard';
import { TenderCard } from './TenderCard';
import { DirectListingCard } from './DirectListingCard';
import { GovernmentPricingSection } from './GovernmentPricingSection';

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
  // Auction carousel refs and state
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  // Tender carousel refs and state
  const tenderCarouselRef = useRef<HTMLDivElement>(null);
  const [tenderCurrentPage, setTenderCurrentPage] = useState(0);
  const [tenderCanScrollLeft, setTenderCanScrollLeft] = useState(false);
  const [tenderCanScrollRight, setTenderCanScrollRight] = useState(true);
  
  // Direct listing carousel refs and state
  const listingCarouselRef = useRef<HTMLDivElement>(null);
  const [listingCurrentPage, setListingCurrentPage] = useState(0);
  const [listingCanScrollLeft, setListingCanScrollLeft] = useState(false);
  const [listingCanScrollRight, setListingCanScrollRight] = useState(true);
  
  // Cards visible per page based on screen size
  const cardsPerPage = 4; // 4 cards per page on desktop

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
          setAuctions(Array.isArray(auctionsRes.data) ? auctionsRes.data.slice(0, 10) : []);
          setTenders(Array.isArray(tendersRes.data) ? tendersRes.data.slice(0, 10) : []);
          setListings(Array.isArray(listingsRes.data) ? listingsRes.data.slice(0, 10) : []);
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

  // Calculate pagination
  const totalPages = Math.ceil(auctions.length / cardsPerPage);

  // Check scroll position
  const checkScrollPosition = () => {
    if (!carouselRef.current) return;
    
    const container = carouselRef.current;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const absScroll = Math.abs(scrollLeft);
    
    // Check if we need scrolling at all
    const needsScrolling = scrollWidth > clientWidth;
    
    if (!needsScrolling) {
      // All cards fit in one page, disable both arrows
      setCanScrollLeft(false);
      setCanScrollRight(false);
      setCurrentPage(0);
      return;
    }
    
    // Update arrow states
    setCanScrollLeft(absScroll > 1); // Can scroll left if not at start
    setCanScrollRight(absScroll < maxScroll - 1); // Can scroll right if not at end
    
    // Calculate current page
    const cardWidth = 280 + 24;
    const scrollAmount = cardsPerPage * cardWidth;
    const currentPageIndex = Math.round(absScroll / scrollAmount);
    setCurrentPage(Math.min(Math.max(currentPageIndex, 0), Math.max(0, totalPages - 1)));
  };

  // Initialize scroll position check
  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;

    // Initial check after render and layout calculation
    const initCheck = () => {
      // Reset scroll to start
      container.scrollLeft = 0;
      // Check position after a delay to ensure layout is calculated
      setTimeout(checkScrollPosition, 200);
    };
    
    // Wait for next frame to ensure layout is calculated
    requestAnimationFrame(() => {
      initCheck();
    });
    
    // Listen for scroll events
    container.addEventListener('scroll', checkScrollPosition, { passive: true });
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [auctions.length, totalPages]);

  // Scroll handlers - Fixed to work correctly
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    
    const container = carouselRef.current;
    const cardWidth = 280 + 24; // card width + gap
    const scrollAmount = cardsPerPage * cardWidth;
    const currentScroll = container.scrollLeft;
    
    // Calculate new scroll position
    let newScroll: number;
    if (direction === 'right') {
      // Scroll right (next page) - move forward
      newScroll = currentScroll + scrollAmount;
    } else {
      // Scroll left (previous page) - move backward
      newScroll = Math.max(0, currentScroll - scrollAmount);
    }
    
    // Scroll to new position
    container.scrollTo({ left: newScroll, behavior: 'smooth' });
    
    // Update state after scroll animation
    setTimeout(() => {
      checkScrollPosition();
    }, 300);
  };

  const goToPage = (pageIndex: number) => {
    if (!carouselRef.current) return;
    
    const container = carouselRef.current;
    const cardWidth = 280 + 24;
    const scrollAmount = pageIndex * cardsPerPage * cardWidth;
    
    container.scrollTo({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkScrollPosition, 100);
  };

  // Tender carousel functions
  const checkTenderScrollPosition = () => {
    if (!tenderCarouselRef.current) return;
    
    const container = tenderCarouselRef.current;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const absScroll = Math.abs(scrollLeft);
    
    const needsScrolling = scrollWidth > clientWidth;
    
    if (!needsScrolling) {
      setTenderCanScrollLeft(false);
      setTenderCanScrollRight(false);
      setTenderCurrentPage(0);
      return;
    }
    
    setTenderCanScrollLeft(absScroll > 1);
    setTenderCanScrollRight(absScroll < maxScroll - 1);
    
    const cardWidth = 280 + 24;
    const scrollAmount = cardsPerPage * cardWidth;
    const currentPageIndex = Math.round(absScroll / scrollAmount);
    const totalPages = Math.ceil(tenders.length / cardsPerPage);
    setTenderCurrentPage(Math.min(Math.max(currentPageIndex, 0), Math.max(0, totalPages - 1)));
  };

  const scrollTenderCarousel = (direction: 'left' | 'right') => {
    if (!tenderCarouselRef.current) return;
    
    const container = tenderCarouselRef.current;
    const cardWidth = 280 + 24;
    const scrollAmount = cardsPerPage * cardWidth;
    const currentScroll = container.scrollLeft;
    
    let newScroll: number;
    if (direction === 'right') {
      newScroll = currentScroll + scrollAmount;
    } else {
      newScroll = Math.max(0, currentScroll - scrollAmount);
    }
    
    container.scrollTo({ left: newScroll, behavior: 'smooth' });
    setTimeout(() => {
      checkTenderScrollPosition();
    }, 300);
  };

  const goToTenderPage = (pageIndex: number) => {
    if (!tenderCarouselRef.current) return;
    
    const container = tenderCarouselRef.current;
    const cardWidth = 280 + 24;
    const scrollAmount = pageIndex * cardsPerPage * cardWidth;
    
    container.scrollTo({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkTenderScrollPosition, 100);
  };

  // Direct listing carousel functions
  const checkListingScrollPosition = () => {
    if (!listingCarouselRef.current) return;
    
    const container = listingCarouselRef.current;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const absScroll = Math.abs(scrollLeft);
    
    const needsScrolling = scrollWidth > clientWidth;
    
    if (!needsScrolling) {
      setListingCanScrollLeft(false);
      setListingCanScrollRight(false);
      setListingCurrentPage(0);
      return;
    }
    
    setListingCanScrollLeft(absScroll > 1);
    setListingCanScrollRight(absScroll < maxScroll - 1);
    
    const cardWidth = 280 + 24;
    const scrollAmount = cardsPerPage * cardWidth;
    const currentPageIndex = Math.round(absScroll / scrollAmount);
    const totalPages = Math.ceil(listings.length / cardsPerPage);
    setListingCurrentPage(Math.min(Math.max(currentPageIndex, 0), Math.max(0, totalPages - 1)));
  };

  const scrollListingCarousel = (direction: 'left' | 'right') => {
    if (!listingCarouselRef.current) return;
    
    const container = listingCarouselRef.current;
    const cardWidth = 280 + 24;
    const scrollAmount = cardsPerPage * cardWidth;
    const currentScroll = container.scrollLeft;
    
    let newScroll: number;
    if (direction === 'right') {
      newScroll = currentScroll + scrollAmount;
    } else {
      newScroll = Math.max(0, currentScroll - scrollAmount);
    }
    
    container.scrollTo({ left: newScroll, behavior: 'smooth' });
    setTimeout(() => {
      checkListingScrollPosition();
    }, 300);
  };

  const goToListingPage = (pageIndex: number) => {
    if (!listingCarouselRef.current) return;
    
    const container = listingCarouselRef.current;
    const cardWidth = 280 + 24;
    const scrollAmount = pageIndex * cardsPerPage * cardWidth;
    
    container.scrollTo({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkListingScrollPosition, 100);
  };

  // Initialize tender carousel
  useEffect(() => {
    const container = tenderCarouselRef.current;
    if (!container) return;

    const initCheck = () => {
      container.scrollLeft = 0;
      setTimeout(checkTenderScrollPosition, 200);
    };
    
    requestAnimationFrame(() => {
      initCheck();
    });
    
    container.addEventListener('scroll', checkTenderScrollPosition, { passive: true });
    window.addEventListener('resize', checkTenderScrollPosition);

    return () => {
      container.removeEventListener('scroll', checkTenderScrollPosition);
      window.removeEventListener('resize', checkTenderScrollPosition);
    };
  }, [tenders.length]);

  // Initialize listing carousel
  useEffect(() => {
    const container = listingCarouselRef.current;
    if (!container) return;

    const initCheck = () => {
      container.scrollLeft = 0;
      setTimeout(checkListingScrollPosition, 200);
    };
    
    requestAnimationFrame(() => {
      initCheck();
    });
    
    container.addEventListener('scroll', checkListingScrollPosition, { passive: true });
    window.addEventListener('resize', checkListingScrollPosition);

    return () => {
      container.removeEventListener('scroll', checkListingScrollPosition);
      window.removeEventListener('resize', checkListingScrollPosition);
    };
  }, [listings.length]);

  if (loading) {
    return (
      <div className="px-4 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="py-2 space-y-8">
      {/* Government Pricing Section */}
      <GovernmentPricingSection />

      {/* Auctions Tab */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">المزادات</h3>
          <Link to="/auctions" className="text-sm font-bold text-green-600 hover:text-green-700 transition-colors flex items-center gap-1">
            عرض الكل
            {/* <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg> */}
          </Link>
        </div>
        {auctions.length > 0 ? (
          <div className="relative">
            {/* Right Arrow (Scroll Right - Next Cards) */}
            <button
              onClick={() => scrollCarousel('right')}
              disabled={!canScrollRight}
              className={`absolute right-0 top-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
                canScrollRight 
                  ? 'bg-white text-[#00741b] hover:bg-gray-50 cursor-pointer' 
                  : 'bg-white text-[#cfcdd3] cursor-not-allowed opacity-50'
              }`}
              style={{ transform: 'translateY(-50%)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Left Arrow (Scroll Left - Previous Cards) */}
            <button
              onClick={() => scrollCarousel('left')}
              disabled={!canScrollLeft}
              className={`absolute left-0 top-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
                canScrollLeft 
                  ? 'bg-white text-[#00741b] hover:bg-gray-50 cursor-pointer' 
                  : 'bg-white text-[#cfcdd3] cursor-not-allowed opacity-50'
              }`}
              style={{ transform: 'translateY(-50%)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Carousel Container - Only scrollable via arrows */}
            <div 
              ref={carouselRef}
              className="overflow-x-auto overflow-y-hidden scrollbar-hide carousel-scroll pb-4 -mx-4 px-4"
                      style={{
                direction: 'ltr',
                scrollBehavior: 'smooth',
                touchAction: 'none',
                overscrollBehavior: 'none'
              }}
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
            >
              <div className="flex gap-6" style={{ direction: 'rtl', willChange: 'transform' }}>
                {auctions.map((auction, index) => (
                  <div key={auction.auctionId} className="flex-shrink-0 w-[280px]">
                    <AuctionCard auction={auction} index={index} />
                  </div>
                ))}
                          </div>
                        </div>

            {/* Pagination Dots */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 gap-2">
                {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                    key={index}
                    onClick={() => goToPage(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      currentPage === index 
                        ? 'bg-[#00741b] w-8' 
                        : 'bg-[#cfcdd3] hover:bg-gray-400'
                    }`}
                    aria-label={`Go to page ${index + 1}`}
                  />
                ))}
                  </div>
            )}
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
          <Link to="/tenders" className="text-sm font-bold text-green-600 hover:text-green-700 transition-colors flex items-center gap-1">
            عرض الكل
            {/* <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg> */}
          </Link>
        </div>
        {tenders.length > 0 ? (
          <div className="relative">
            {/* Right Arrow */}
            <button
              onClick={() => scrollTenderCarousel('right')}
              disabled={!tenderCanScrollRight}
              className={`absolute right-0 top-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
                tenderCanScrollRight 
                  ? 'bg-white text-[#00741b] hover:bg-gray-50 cursor-pointer' 
                  : 'bg-white text-[#cfcdd3] cursor-not-allowed opacity-50'
              }`}
              style={{ transform: 'translateY(-50%)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Left Arrow */}
            <button
              onClick={() => scrollTenderCarousel('left')}
              disabled={!tenderCanScrollLeft}
              className={`absolute left-0 top-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
                tenderCanScrollLeft 
                  ? 'bg-white text-[#00741b] hover:bg-gray-50 cursor-pointer' 
                  : 'bg-white text-[#cfcdd3] cursor-not-allowed opacity-50'
              }`}
              style={{ transform: 'translateY(-50%)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Carousel Container */}
            <div 
              ref={tenderCarouselRef}
              className="overflow-x-auto overflow-y-hidden scrollbar-hide carousel-scroll pb-4 -mx-4 px-4"
              style={{ 
                direction: 'ltr',
                scrollBehavior: 'smooth',
                touchAction: 'none',
                overscrollBehavior: 'none'
              }}
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
            >
              <div className="flex gap-6" style={{ direction: 'rtl', willChange: 'transform' }}>
                {tenders.map((tender, index) => (
                  <div key={tender.tenderId} className="flex-shrink-0 w-[280px]">
                    <TenderCard tender={tender} index={index} />
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Dots */}
            {Math.ceil(tenders.length / cardsPerPage) > 1 && (
              <div className="flex justify-center items-center mt-6 gap-2">
                {Array.from({ length: Math.ceil(tenders.length / cardsPerPage) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToTenderPage(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      tenderCurrentPage === index 
                        ? 'bg-[#00741b] w-8' 
                        : 'bg-[#cfcdd3] hover:bg-gray-400'
                    }`}
                    aria-label={`Go to page ${index + 1}`}
                  />
                ))}
              </div>
            )}
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
          <Link to="/direct-selling" className="text-sm font-bold text-green-600 hover:text-green-700 transition-colors flex items-center gap-1">
            عرض الكل
            {/* <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg> */}
          </Link>
        </div>
        {listings.length > 0 ? (
          <div className="relative">
            {/* Right Arrow */}
            <button
              onClick={() => scrollListingCarousel('right')}
              disabled={!listingCanScrollRight}
              className={`absolute right-0 top-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
                listingCanScrollRight 
                  ? 'bg-white text-[#00741b] hover:bg-gray-50 cursor-pointer' 
                  : 'bg-white text-[#cfcdd3] cursor-not-allowed opacity-50'
              }`}
              style={{ transform: 'translateY(-50%)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Left Arrow */}
            <button
              onClick={() => scrollListingCarousel('left')}
              disabled={!listingCanScrollLeft}
              className={`absolute left-0 top-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
                listingCanScrollLeft 
                  ? 'bg-white text-[#00741b] hover:bg-gray-50 cursor-pointer' 
                  : 'bg-white text-[#cfcdd3] cursor-not-allowed opacity-50'
              }`}
              style={{ transform: 'translateY(-50%)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Carousel Container */}
            <div 
              ref={listingCarouselRef}
              className="overflow-x-auto overflow-y-hidden scrollbar-hide carousel-scroll pb-4 -mx-4 px-4"
              style={{ 
                direction: 'ltr',
                scrollBehavior: 'smooth',
                touchAction: 'none',
                overscrollBehavior: 'none'
              }}
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
            >
              <div className="flex gap-6" style={{ direction: 'rtl', willChange: 'transform' }}>
                {listings.map((listing, index) => (
                  <div key={listing.listingId} className="flex-shrink-0 w-[280px]">
                    <DirectListingCard listing={listing} index={index} />
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Dots */}
            {Math.ceil(listings.length / cardsPerPage) > 1 && (
              <div className="flex justify-center items-center mt-6 gap-2">
                {Array.from({ length: Math.ceil(listings.length / cardsPerPage) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToListingPage(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      listingCurrentPage === index 
                        ? 'bg-[#00741b] w-8' 
                        : 'bg-[#cfcdd3] hover:bg-gray-400'
                    }`}
                    aria-label={`Go to page ${index + 1}`}
                  />
                ))}
              </div>
            )}
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

