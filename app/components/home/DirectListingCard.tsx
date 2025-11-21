import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '~/hooks/useAuth';
import { addToFavorites, removeFromFavorites, getUserFavorites } from '~/lib/services/favorites';
import { getAuthUser } from '~/lib/storage/auth-storage';
import type { DirectListing } from '~/lib/types/direct';
import { EmptyPlaceholder } from './EmptyPlaceholder';

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

interface DirectListingCardProps {
  listing: DirectListing;
  index?: number;
}

export function DirectListingCard({ listing, index = 0 }: DirectListingCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  
  const mainImage = listing.productMainImage || (listing.images && listing.images[0]);
  const location = listing.location || "محافظة دمشق";
  const quantity = listing.availableQty ? `${listing.availableQty} ${listing.unit || 'كغ'}` : '0 كغ';
  const title = listing.title || listing.cropName || 'عرض للبيع المباشر';
  
  // Get color from API or fallback
  const apiColor = listing.productCardColor;
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

        const favorites = await getUserFavorites(Number(userId), 'direct-selling');
        const isFav = favorites.some((fav) => fav.contextId === listing.listingId);
        setIsFavorite(isFav);
      } catch (error) {
        console.error('Error checking favorite status:', error);
        setIsFavorite(false);
      }
    };

    checkFavoriteStatus();
  }, [isAuthenticated, listing.listingId]);

  // Handle favorite toggle
  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
        await removeFromFavorites(userIdNum, 'direct-selling', listing.listingId);
        setIsFavorite(false);
      } else {
        await addToFavorites(userIdNum, 'direct-selling', listing.listingId);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  return (
    <Link
      to={`/direct-selling/${listing.listingId}`}
      className="group block relative w-full max-w-[280px] mx-auto rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}
    >
      {/* 1. Top Half - Base Color from API */}
      <div 
        className={`relative pt-12 px-4 pb-2 ${!apiColor ? `bg-gradient-to-br ${fallbackGradientClass}` : ''}`}
        style={apiColor ? gradientStyle : undefined}
      >
        {/* Favorite Button */}
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
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
        </button>

        {/* Location */}
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
              alt={title}
              className="h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <EmptyPlaceholder type="listing" />
          )}
        </div>

        {/* Title */}
        <h3 className="text-white text-center font-bold text-lg mb-2 drop-shadow-sm">
          {title}
        </h3>
      </div>

      {/* White Center Line */}
      <div className="w-full h-0.5 bg-white/80"></div>

      {/* 2. Info Section (Darker Overlay) */}
      <div 
        className={`px-4 py-3 space-y-2 text-white text-[11px] ${!apiColor ? 'bg-black/20 backdrop-blur-sm' : ''}`}
        style={apiColor ? infoBgStyle : undefined}
      >
        {/* Available Quantity */}
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="opacity-90">الكمية المتاحة:</span>
            <span className="font-bold">{quantity}</span>
          </div>
          <svg className="w-3.5 h-3.5 opacity-80" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
        </div>

        {/* Unit Price */}
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="opacity-90">السعر:</span>
            <span className="font-bold">{listing.unitPrice?.toLocaleString() || '-'} ل.س</span>
          </div>
          <svg className="w-3.5 h-3.5 opacity-80" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
          </svg>
        </div>

        {/* White Line after price */}
        <div className="w-full h-0.5 bg-white/80 mt-2"></div>
      </div>

      {/* 3. Footer: Price Display (Darkest) */}
      <div 
        className={`py-3 ${!apiColor ? 'bg-black/40 backdrop-blur-md' : ''}`}
        style={apiColor ? footerBgStyle : undefined}
      >
        <div className="text-center text-white">
          <div className="text-xs opacity-90 mb-1">السعر للوحدة الواحدة</div>
          <div className="text-xl font-bold">
            {listing.unitPrice?.toLocaleString() || '-'} ل.س / {listing.unit || 'وحدة'}
          </div>
        </div>
      </div>
    </Link>
  );
}

