import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Header } from '~/components/Header';
import { getOpenAuctions } from '~/lib/services/auction';
import type { OpenAuction } from '~/lib/types/auction';
import { EmptyPlaceholder } from '~/components/home/EmptyPlaceholder';

export default function AuctionsIndex() {
  const [auctions, setAuctions] = useState<OpenAuction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getOpenAuctions();
        setAuctions(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to load auctions", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
     return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">المزادات المفتوحة</h1>
            <Link to="/auctions/new" className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-md flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                إنشاء مزاد
            </Link>
        </div>

        {auctions.length === 0 ? (
            <div className="text-center py-20">
                <p className="text-gray-500 text-lg">لا توجد مزادات مفتوحة حالياً.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {auctions.map((auction) => (
                     <Link 
                        key={auction.auctionId} 
                        to={`/auctions/${auction.auctionId}`}
                        className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 flex flex-col"
                     >
                        <div className="h-48 bg-gray-200 relative">
                             {auction.productMainImage ? (
                                 <img src={auction.productMainImage} alt={auction.auctionTitle} className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                             )}
                             <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold text-gray-700">
                                {auction.cropName || `Crop #${auction.cropId}`}
                             </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{auction.auctionTitle}</h3>
                            <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{auction.auctionDescription || 'لا يوجد وصف'}</p>
                            
                            <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-50">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">السعر الحالي</p>
                                    <p className="text-green-600 font-bold text-lg">{auction.currentPrice?.toLocaleString()} ل.س</p>
                                </div>
                                <div className="text-left">
                                     <p className="text-xs text-gray-400 mb-1">الزيادة</p>
                                     <p className="text-gray-700 font-bold text-sm">+{auction.minIncrement?.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                     </Link>
                 ))}
            </div>
        )}
      </div>
    </div>
  );
}

