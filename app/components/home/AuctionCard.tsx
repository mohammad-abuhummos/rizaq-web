import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import type { OpenAuction } from '~/lib/types/auction';
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
    <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 px-4 py-2.5 rounded-xl shadow-lg" dir="rtl">
      <div className="flex items-center gap-1.5 text-white font-bold text-sm">
        <div className="flex flex-col items-center">
          <span className="text-lg leading-none">{formatNumber(timeLeft.seconds)}</span>
          <span className="text-[10px] opacity-90">ثانية</span>
        </div>
        <span className="text-lg">:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg leading-none">{formatNumber(timeLeft.minutes)}</span>
          <span className="text-[10px] opacity-90">دقيقة</span>
        </div>
        <span className="text-lg">:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg leading-none">{formatNumber(timeLeft.hours)}</span>
          <span className="text-[10px] opacity-90">ساعة</span>
        </div>
        <span className="text-lg">:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg leading-none">{formatNumber(timeLeft.days)}</span>
          <span className="text-[10px] opacity-90">يوم</span>
        </div>
      </div>
      <svg className="w-5 h-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
}

interface AuctionCardProps {
  auction: OpenAuction;
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const cardColor = auction.productCardColor || '#10B981';
  const mainImage = auction.productMainImage || (auction.images && auction.images[0]);
  const currentPrice = auction.currentPrice || auction.startingPrice;
  const priceIncrease = currentPrice > auction.startingPrice
    ? ((currentPrice - auction.startingPrice) / auction.startingPrice * 100).toFixed(1)
    : '0';

  return (
    <Link
      to={`/auctions/${auction.auctionId}`}
      className="group relative bg-white rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
      style={{
        boxShadow: `0 4px 20px ${cardColor}20`,
        border: '1px solid rgba(0,0,0,0.05)',
        direction: 'rtl'
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
        <div className="absolute bottom-0 left-0 right-0 p-4" dir="rtl">
          <h4 className="text-xl font-bold text-white drop-shadow-lg line-clamp-2 mb-1 text-right">
            {auction.auctionTitle || 'مزاد زراعي'}
          </h4>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-4" dir="rtl">
        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed min-h-[40px] text-right">
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
}

