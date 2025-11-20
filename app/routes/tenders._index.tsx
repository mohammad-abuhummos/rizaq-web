import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Header } from '~/components/Header';
import { listOpenTenders } from '~/lib/services/tender';
import type { Tender } from '~/lib/types/tender';
import { EmptyPlaceholder } from '~/components/home/EmptyPlaceholder';

export default function TendersIndex() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await listOpenTenders();
        const data = (res as any)?.data ?? res;
        setTenders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load tenders", error);
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
            <h1 className="text-3xl font-bold text-gray-900">المناقصات المفتوحة</h1>
            <Link to="/tenders/new" className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-md flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                إنشاء مناقصة
            </Link>
        </div>

        {tenders.length === 0 ? (
            <div className="text-center py-20">
                <p className="text-gray-500 text-lg">لا توجد مناقصات مفتوحة حالياً.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {tenders.map((tender) => (
                     <Link 
                        key={tender.tenderId} 
                        to={`/tenders/${tender.tenderId}`}
                        className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 flex flex-col"
                     >
                        <div className="h-40 bg-purple-50 relative flex items-center justify-center overflow-hidden">
                            <EmptyPlaceholder type="tender" />
                            <div className="absolute top-3 right-3 bg-purple-600/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold text-white">
                                مفتوحة
                            </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{tender.title || tender.cropName || 'مناقصة زراعية'}</h3>
                            <p className="text-gray-500 text-sm mb-3 line-clamp-1">{tender.cropName}</p>
                            
                            <div className="mt-auto space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">الكمية المطلوبة</span>
                                    <span className="font-bold text-gray-800">{tender.quantity?.toLocaleString()} {tender.unit}</span>
                                </div>
                                {tender.maxBudget && (
                                    <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-50">
                                        <span className="text-gray-500">الميزانية</span>
                                        <span className="font-bold text-green-600">{tender.maxBudget.toLocaleString()} ل.س</span>
                                    </div>
                                )}
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

