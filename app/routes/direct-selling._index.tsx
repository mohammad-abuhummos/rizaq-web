import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Header } from '~/components/Header';
import { listDirectListings } from '~/lib/services/direct';
import type { DirectListing } from '~/lib/types/direct';
import { EmptyPlaceholder } from '~/components/home/EmptyPlaceholder';

export default function DirectSellingIndex() {
  const [listings, setListings] = useState<DirectListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await listDirectListings();
        // Handle API response structure
        const data = (res as any)?.data ?? res;
        setListings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load listings", error);
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
            <h1 className="text-3xl font-bold text-gray-900">سوق البيع المباشر</h1>
            <Link to="/direct-selling/new" className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-md flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                إضافة عرض
            </Link>
        </div>

        {listings.length === 0 ? (
            <div className="text-center py-20">
                <p className="text-gray-500 text-lg">لا توجد عروض بيع مباشر حالياً.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {listings.map((listing) => (
                     <Link 
                        key={listing.listingId} 
                        to={`/direct-selling/${listing.listingId}`}
                        className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 flex flex-col"
                     >
                        <div className="h-48 bg-gray-100 relative flex items-center justify-center overflow-hidden">
                            <EmptyPlaceholder type="listing" />
                             <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold text-white">
                                {listing.unitPrice?.toLocaleString()} ل.س / {listing.unit}
                             </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{listing.title || listing.cropName || 'عرض للبيع المباشر'}</h3>
                            <p className="text-gray-500 text-sm mb-3 line-clamp-1">{listing.cropName}</p>
                            
                            <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-50">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">الكمية المتاحة</p>
                                    <p className="text-green-600 font-bold text-sm">{listing.availableQty?.toLocaleString()} {listing.unit}</p>
                                </div>
                                <div className="text-left">
                                     <p className="text-xs text-gray-400 mb-1">أقل طلب</p>
                                     <p className="text-gray-700 font-bold text-sm">{listing.minOrderQty?.toLocaleString()} {listing.unit}</p>
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

