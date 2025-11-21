import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { getLatestGovernmentPricesWithChanges } from '~/lib/services/government-price';
import type { GovernmentPriceWithProduct } from '~/lib/types/government-price';
import { EmptyPlaceholder } from './EmptyPlaceholder';

// Sparkline Chart Component
function SparklineChart({ 
  data, 
  isPositive 
}: { 
  data: number[]; 
  isPositive: boolean;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="w-16 h-8 flex items-center justify-center text-gray-400 text-xs">
        لا بيانات
      </div>
    );
  }

  // Normalize data for chart display
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Avoid division by zero
  
  const width = 60;
  const height = 30;
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Scale data points
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * chartWidth + padding;
    const y = height - ((value - min) / range) * chartHeight - padding;
    return { x, y };
  });

  // Create SVG path
  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const color = isPositive ? '#10b981' : '#ef4444'; // green-500 : red-500

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Individual Price Card Component
function GovernmentPriceCard({ 
  priceData 
}: { 
  priceData: GovernmentPriceWithProduct;
}) {
  const formattedPrice = priceData.currentPrice.toLocaleString('ar-SY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const percentageChange = priceData.percentageChange;
  const isPositive = percentageChange !== null && percentageChange >= 0;
  const changeDisplay = percentageChange !== null 
    ? `${isPositive ? '+' : ''}${percentageChange.toFixed(1)}%`
    : '--';

  const productName = priceData.productName || `منتج #${priceData.productId}`;
  const productImage = priceData.productImage;

  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg"
      style={{
        backgroundColor: '#1e1e1e',
        minHeight: '70px',
        maxHeight: '85px',
        borderRadius: '8px',
        direction: 'rtl',
        fontFamily: 'Cairo, sans-serif'
      }}
    >
      {/* RIGHT SIDE: Product Name, Subtitle, Image */}
      <div className="flex items-center gap-3 flex-1">
        {/* Product Image */}
        <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-gray-700 flex items-center justify-center">
          {productImage ? (
            <img
              src={productImage}
              alt={productName}
              className="w-full h-full object-cover"
            />
          ) : (
            <EmptyPlaceholder type="listing" />
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col items-start">
          <div className="text-white font-bold text-sm leading-tight">
            {productName}
          </div>
          <div className="text-gray-400 text-xs mt-1">
            الشهر الحالي
          </div>
        </div>
      </div>

      {/* LEFT SIDE: Price, Change, Chart */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        {/* Sparkline Chart */}
        <div className="flex items-center">
          <SparklineChart 
            data={priceData.priceHistory || []} 
            isPositive={isPositive}
          />
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-10 bg-gray-600 mx-1"></div>

        {/* Price and Percentage */}
        <div className="flex flex-col items-end">
          <div className="text-white text-lg font-bold leading-tight" style={{ direction: 'ltr' }}>
            ل.س {formattedPrice}
          </div>
          <div 
            className={`text-xs font-semibold mt-0.5 ${
              percentageChange === null 
                ? 'text-gray-400' 
                : isPositive 
                  ? 'text-green-500' 
                  : 'text-red-500'
            }`}
            style={{ direction: 'ltr' }}
          >
            {changeDisplay}
          </div>
        </div>
      </div>
    </div>
  );
}

const CITIES = [
  'دمشق', 'حمص', 'اللاذقية', 'درعا', 'حلب', 
  'طرطوس', 'الرقة', 'حماة', 'إدلب', 'السويداء'
];

function CitySelector() {
  const [selectedCity, setSelectedCity] = useState('دمشق');

  return (
    <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide py-4 px-2 mb-2" style={{ direction: 'rtl' }}>
      {CITIES.map((city) => (
        <button
          key={city}
          onClick={() => setSelectedCity(city)}
          className={`text-base font-bold whitespace-nowrap transition-colors ${
            selectedCity === city 
              ? 'text-green-700 scale-105' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {city}
        </button>
      ))}
    </div>
  );
}

// Main Government Pricing Section Component
export function GovernmentPricingSection() {
  const [prices, setPrices] = useState<GovernmentPriceWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getLatestGovernmentPricesWithChanges();
        setPrices(data);
      } catch (err: any) {
        console.error('Error loading government prices:', err);
        setError('فشل تحميل أسعار الحكومة');
        setPrices([]);
      } finally {
        setLoading(false);
      }
    };

    loadPrices();
  }, []);

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || prices.length === 0) {
    return null; // Don't show section if no data
  }

  return (
    <div className="py-2 bg-gray-50 rounded-xl p-4 mb-8 shadow-sm" style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
      {/* City Selector Header */}
      <CitySelector />

      {/* Price Cards Container */}
      <div className="space-y-2 relative pb-12">
        {prices.map((priceData) => (
          <GovernmentPriceCard 
            key={priceData.governmentPriceId} 
            priceData={priceData}
          />
        ))}
        
        {/* Gradient Overlay for Fade Effect */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(249, 250, 251, 1) 0%, rgba(249, 250, 251, 0.8) 40%, rgba(249, 250, 251, 0) 100%)',
            zIndex: 10
          }}
        ></div>

        {/* Floating Navigation Button */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center z-20 pb-4">
          <Link
            to="/market-analysis"
            className="bg-green-700 hover:bg-green-800 text-white text-center font-bold py-3 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            شاهد تحليلات السوق
          </Link>
        </div>
      </div>
    </div>
  );
}

