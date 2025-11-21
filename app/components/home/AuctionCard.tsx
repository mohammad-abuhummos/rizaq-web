import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '~/hooks/useAuth';
import { addToFavorites, removeFromFavorites, getUserFavorites } from '~/lib/services/favorites';
import { getAuthUser } from '~/lib/storage/auth-storage';
import type { OpenAuction } from '~/lib/types/auction';

// Vibrant gradient backgrounds fallback
const GRADIENT_COLORS = [
  'from-pink-500 via-pink-600 to-rose-700',       // Pink/Red
  'from-orange-500 via-orange-600 to-amber-700',  // Orange
  'from-lime-500 via-green-600 to-emerald-700',   // Lime/Green
  'from-red-500 via-rose-600 to-pink-700',        // Red/Pink
  'from-yellow-400 via-yellow-500 to-orange-600', // Yellow/Orange
  'from-purple-500 via-purple-600 to-fuchsia-700',// Purple
  'from-blue-500 via-blue-600 to-indigo-700',     // Blue
  'from-teal-500 via-teal-600 to-cyan-700',       // Teal
];

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Helper function to darken a color
function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const r = Math.max(0, Math.floor(rgb.r * (1 - percent / 100)));
  const g = Math.max(0, Math.floor(rgb.g * (1 - percent / 100)));
  const b = Math.max(0, Math.floor(rgb.b * (1 - percent / 100)));
  
  return `rgb(${r}, ${g}, ${b})`;
}

// Helper function to lighten a color
function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * percent / 100));
  const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * percent / 100));
  const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * percent / 100));
  
  return `rgb(${r}, ${g}, ${b})`;
}

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
    <div className="flex items-center justify-center gap-4 text-white" dir="rtl">
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold leading-none">{formatNumber(timeLeft.seconds)}</span>
        <span className="text-[10px] mt-1 font-medium opacity-90">ثانية</span>
      </div>
      <span className="text-xl font-bold -mt-4">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold leading-none">{formatNumber(timeLeft.minutes)}</span>
        <span className="text-[10px] mt-1 font-medium opacity-90">دقيقة</span>
      </div>
      <span className="text-xl font-bold -mt-4">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold leading-none">{formatNumber(timeLeft.hours)}</span>
        <span className="text-[10px] mt-1 font-medium opacity-90">ساعة</span>
      </div>
      <span className="text-xl font-bold -mt-4">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold leading-none">{formatNumber(timeLeft.days)}</span>
        <span className="text-[10px] mt-1 font-medium opacity-90">يوم</span>
      </div>
    </div>
  );
}

interface AuctionCardProps {
  auction: OpenAuction;
  index?: number;
}

export function AuctionCard({ auction, index = 0 }: AuctionCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  
  const mainImage = auction.productMainImage || (auction.images && auction.images[0]);
  const currentPrice = auction.currentPrice || auction.startingPrice;
  const location = auction.location || "محافظة دمشق"; // Fallback as seen in design
  const quantity = auction.quantity ? `${auction.quantity} ${auction.unit || 'كغ'}` : '500 كغ'; // Fallback
  
  // Get color from API or fallback
  const apiColor = auction.productCardColor;
  const fallbackGradientClass = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
  
  // Create styles
  let gradientStyle: React.CSSProperties | undefined = undefined;
  let infoBgStyle: React.CSSProperties | undefined = undefined;
  let footerBgStyle: React.CSSProperties | undefined = undefined;
  
  if (apiColor && /^#?[0-9A-Fa-f]{6}$/.test(apiColor)) {
    const baseColor = apiColor.startsWith('#') ? apiColor : `#${apiColor}`;
    
    // Create gradient shades
    const lightColor = lightenColor(baseColor, 15);  // Lighter
    const baseColorRgb = baseColor;
    const darkColor = darkenColor(baseColor, 10);    // Slightly darker
    
    // Bottom half: 4 shades darker
    const shade4 = darkenColor(baseColor, 60);  // 4 shades darker (for bottom half)
    
    // Top half background - gradient from API color
    gradientStyle = {
      background: `linear-gradient(to bottom right, ${lightColor}, ${baseColorRgb}, ${darkColor})`,
    };
    
    // Info section (bottom half) - 4 shades darker
    infoBgStyle = {
      backgroundColor: shade4,
    };

    // Footer (same as bottom half)
    footerBgStyle = {
      backgroundColor: shade4,
    };
  }
  
  // Check favorite status on mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!isAuthenticated) {
        setIsFavorite(false);
        return;
      }

      try {
        const auth = await getAuthUser<{ userId?: number; id?: number }>();
        const userId = auth?.userId ?? auth?.id;
        
        if (!userId) {
          setIsFavorite(false);
          return;
        }

        const favorites = await getUserFavorites(Number(userId), 'auction');
        const isFav = favorites.some((fav) => fav.contextId === auction.auctionId);
        setIsFavorite(isFav);
      } catch (error) {
        console.error('Error checking favorite status:', error);
        setIsFavorite(false);
      }
    };

    checkFavoriteStatus();
  }, [isAuthenticated, auction.auctionId]);

  // Handle favorite toggle
  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If not authenticated, navigate to login
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isLoadingFavorite) return;

    try {
      setIsLoadingFavorite(true);
      const auth = await getAuthUser<{ userId?: number; id?: number }>();
      const userId = auth?.userId ?? auth?.id;

      if (!userId) {
        navigate('/login');
        return;
      }

      const userIdNum = Number(userId);

      if (isFavorite) {
        // Remove from favorites
        await removeFromFavorites(userIdNum, 'auction', auction.auctionId);
        setIsFavorite(false);
      } else {
        // Add to favorites
        await addToFavorites(userIdNum, 'auction', auction.auctionId);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Show error message or toast if needed
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd}`;
  };

  return (
    <Link
      to={`/auctions/${auction.auctionId}/join`}
      className="group block relative w-full max-w-[280px] mx-auto rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}
    >
      {/* 1. Top Half - Base Color from API */}
      <div 
        className={`relative pt-12 px-4 pb-2 ${!apiColor ? `bg-gradient-to-br ${fallbackGradientClass}` : ''}`}
        style={apiColor ? gradientStyle : undefined}
      >
        {/* Favorite Button (Top Left Corner - Touching Borders) */}
        <button 
          onClick={handleFavoriteToggle}
          disabled={isLoadingFavorite}
          className={`absolute top-0 left-0 w-12 h-12 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 z-10 ${
            isFavorite 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-700 hover:bg-green-800'
          } ${isLoadingFavorite ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
          style={{ 
            borderTopLeftRadius: '0',
            borderTopRightRadius: '0',
            borderBottomLeftRadius: '0',
            borderBottomRightRadius: '0.5rem'
          }}
        >
          {isFavorite ? (
            // Minus icon (red box when favorited)
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
            </svg>
          ) : (
            // Plus icon (green box when not favorited)
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
        </button>

        {/* Location (Top Right Corner) */}
        <div className="absolute top-0 right-0 flex items-center gap-1 text-white px-3 py-2 z-10">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-medium">{location}</span>
        </div>

        {/* Product Image */}
        <div className="relative h-36 flex items-center justify-center mb-2">
          {mainImage ? (
            <img
              src={mainImage}
              alt={auction.auctionTitle || 'مزاد'}
              className="h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Product Title */}
        <h3 className="text-white text-center font-bold text-lg mb-2 drop-shadow-sm">
          {auction.auctionTitle || 'منتج'}
        </h3>
      </div>

      {/* White Center Line */}
      <div className="w-full h-0.5 bg-white/80"></div>

      {/* 2. Info Section (Darker Overlay) */}
      <div 
        className={`px-4 py-3 space-y-2 text-white text-[11px] ${!apiColor ? 'bg-black/20 backdrop-blur-sm' : ''}`}
        style={apiColor ? infoBgStyle : undefined}
      >
        {/* Quantity */}
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="opacity-90">الكمية:</span>
            <span className="font-bold">{quantity}</span>
          </div>
          <svg className="w-3.5 h-3.5 opacity-80" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
        </div>

        {/* Base Price */}
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="opacity-90">السعر الأساسي:</span>
            <span className="font-bold">{auction.startingPrice.toLocaleString()} ل.س</span>
          </div>
          <svg className="w-3.5 h-3.5 opacity-80" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
          </svg>
        </div>

        {/* Highest Bid */}
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="opacity-90">أعلى عرض:</span>
            <span className="font-bold">{(currentPrice || auction.startingPrice).toLocaleString()} ل.س</span>
          </div>
          <svg className="w-3.5 h-3.5 opacity-80" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
          </svg>
        </div>

        {/* Offer Count */}
        <div className="flex items-center justify-between pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="opacity-90">عدد العروض:</span>
            <span className="font-bold">{auction.bidCount || 0} عرض</span>
          </div>
          <svg className="w-3.5 h-3.5 opacity-80" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        </div>

        {/* White Line after عدد العروض */}
        <div className="w-full h-0.5 bg-white/80 mb-2"></div>

        {/* End Date */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          <svg className="w-3.5 h-3.5 opacity-80" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <span>تاريخ انتهاء المزاد: {formatDate(auction.endTime)}</span>
        </div>

        {/* White Line after تاريخ انتهاء */}
        <div className="w-full h-0.5 bg-white/80 mt-2"></div>
      </div>

      {/* 3. Footer: Countdown (Darkest) */}
      <div 
        className={`py-3 ${!apiColor ? 'bg-black/40 backdrop-blur-md' : ''}`}
        style={apiColor ? footerBgStyle : undefined}
      >
        <CountdownTimer endTime={auction.endTime} />
      </div>
    </Link>
  );
}
