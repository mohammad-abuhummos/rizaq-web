import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Header } from '~/components/Header';
import { getAuctionById, listAuctionsCreatedByUser } from '~/lib/services/auction';
import { getCropById } from '~/lib/services/crop';
import { getAuthUser } from '~/lib/storage/auth-storage';
import { CountdownTimer } from '~/components/CountdownTimer';
import type { AuctionDetail } from '~/lib/types/auction';
import type { CropDetail } from '~/lib/types/crop';

// Fallback random images for auctions if no real images are available
const AUCTION_IMAGES = [
  "https://images.pexels.com/photos/1300975/pexels-photo-1300975.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1268101/pexels-photo-1268101.jpeg?auto=compress&cs=tinysrgb&w=800",
];

const getRandomImage = (id: number) => AUCTION_IMAGES[id % AUCTION_IMAGES.length];

export default function AuctionDetail() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [crop, setCrop] = useState<CropDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuctionDetails = async () => {
      if (!auctionId) {
        setError("معرف المزاد غير صحيح");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getAuctionById(Number(auctionId));
        setAuction(response.data);

        // Fetch crop details if cropId is available
        if (response.data.cropId) {
          try {
            const cropResponse = await getCropById(response.data.cropId);
            setCrop(cropResponse.data);
          } catch (cropErr) {
            console.error("Error fetching crop details:", cropErr);
          }
        }

        // Determine ownership
        try {
          const auth = await getAuthUser<{ userId?: number; id?: number }>();
          const uid = auth?.userId || auth?.id;

          if (uid) {
            const ownerId = (response.data as any)?.createdByUserId;
            if (ownerId) {
              setIsOwner(String(ownerId) === String(uid));
            } else {
               // Fallback
               const mine = await listAuctionsCreatedByUser(uid).catch(() => ({ data: [] }));
               const myList = (mine as any)?.data ?? mine;
               const found = Array.isArray(myList) && myList.some((a: any) => String(a?.auctionId) === String(auctionId));
               setIsOwner(Boolean(found));
            }
          }
        } catch (e) {
           console.log("Auth check failed", e);
        }

      } catch (err) {
        console.error("Error fetching auction details:", err);
        setError("فشل في تحميل تفاصيل المزاد");
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionDetails();
  }, [auctionId]);

  const handleJoinAuction = () => {
    if (!auction) return;
    if (auction.status !== "open") {
        alert("المزاد غير متاح حالياً");
        return;
    }
    // In web, we typically don't pass complex objects in URL, just IDs or use state management
    // Passing ownerMode as query param
    navigate(`/auctions/${auction.auctionId}/join?ownerMode=${isOwner}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
        <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col justify-center items-center h-[calc(100vh-80px)] space-y-4">
          <div className="text-red-500 text-6xl">⚠️</div>
          <p className="text-xl font-bold text-gray-800">{error || "حدث خطأ"}</p>
          <Link to="/home" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const resolvePrimaryImageUrl = () => {
    const anyAuction = auction as any;
    if (anyAuction?.images && Array.isArray(anyAuction.images) && anyAuction.images.length > 0) return anyAuction.images[0];
    if (anyAuction?.imageUrls && Array.isArray(anyAuction.imageUrls) && anyAuction.imageUrls.length > 0) return anyAuction.imageUrls[0];
    if (crop && (crop as any)?.images && Array.isArray((crop as any).images) && (crop as any).images.length > 0) return (crop as any).images[0];
    return getRandomImage(auction.auctionId);
  };

  const primaryImageUrl = resolvePrimaryImageUrl();
  const isAuctionOpen = auction.status === "open";

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb or Back Button */}
        <div className="mb-6">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-green-600 transition-colors">
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                عودة
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Right Column: Images & Timer */}
            <div className="lg:col-span-2 space-y-6">
                {/* Image Card */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden relative">
                     <img 
                        src={primaryImageUrl} 
                        alt={auction.auctionTitle} 
                        className="w-full h-[400px] object-cover"
                     />
                     <div className={`absolute top-4 right-4 px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg ${isAuctionOpen ? 'bg-green-600' : 'bg-gray-600'}`}>
                        {isAuctionOpen ? "مفتوح" : auction.status === "closed" ? "مغلق" : "قريباً"}
                     </div>
                     <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-full flex items-center gap-1 shadow-md">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-semibold text-green-800">محافظة دمشق</span>
                     </div>
                </div>

                {/* Content Card */}
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{auction.auctionTitle}</h1>
                            <p className="text-gray-500 text-sm">رقم المزاد #{auction.auctionId}</p>
                        </div>
                        {isOwner && (
                            <Link to={`/auctions/${auction.auctionId}/edit`} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-100 transition-colors">
                                تعديل المزاد
                            </Link>
                        )}
                    </div>
                    
                    {auction.auctionDescription && (
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">الوصف</h3>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{auction.auctionDescription}</p>
                        </div>
                    )}

                    <div className="mb-8">
                        <CountdownTimer endTime={auction.endTime} />
                    </div>

                     {/* Price Info */}
                    <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 mb-6">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-emerald-100/50">
                            <span className="text-gray-600 font-semibold">السعر الابتدائي</span>
                            <span className="text-xl font-bold text-emerald-800">{auction.startingPrice.toLocaleString()} ل.س</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 font-semibold">السعر الحالي</span>
                            <span className="text-3xl font-bold text-emerald-700">{auction.currentPrice.toLocaleString()} ل.س</span>
                        </div>
                    </div>

                     {/* Action Button */}
                    <button
                        onClick={handleJoinAuction}
                        disabled={!isAuctionOpen}
                        className={`w-full py-4 rounded-xl text-lg font-bold text-white transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg flex items-center justify-center gap-2 ${!isAuctionOpen ? "bg-gray-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        {!isAuctionOpen 
                            ? "المزاد غير متاح" 
                            : isOwner 
                                ? "مراقبة المزاد (المالك)" 
                                : "الانضمام للمزاد"
                        }
                    </button>
                </div>
            </div>

            {/* Left Column: Details */}
            <div className="space-y-6">
                 {/* Auction Details */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">تفاصيل إضافية</h3>
                    <div className="space-y-4">
                         <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">الحد الأدنى للزيادة</span>
                            <span className="font-bold text-gray-800">{auction.minIncrement.toLocaleString()} ل.س</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">تاريخ البدء</span>
                            <span className="font-bold text-gray-800">
                                {new Date(auction.startTime).toLocaleDateString("ar-EG")}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">تاريخ الانتهاء</span>
                            <span className="font-bold text-gray-800">
                                {new Date(auction.endTime).toLocaleDateString("ar-EG")}
                            </span>
                        </div>
                         <div className="flex justify-between items-center py-2">
                            <span className="text-gray-500 text-sm">رقم المحصول</span>
                            <span className="font-bold text-gray-800">#{auction.cropId}</span>
                        </div>
                    </div>
                </div>

                {/* Crop Details */}
                {crop && (
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                         <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            معلومات المحصول
                         </h3>
                         <div className="space-y-4">
                            {crop.name && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500 text-sm">الاسم</span>
                                    <span className="font-bold text-gray-800">{crop.name}</span>
                                </div>
                            )}
                             {crop.quantity > 0 && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500 text-sm">الكمية</span>
                                    <span className="font-bold text-gray-800">{crop.quantity.toLocaleString()} {crop.unit}</span>
                                </div>
                            )}
                             {crop.qualityGrade && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500 text-sm">الجودة</span>
                                    <span className="font-bold text-gray-800">{crop.qualityGrade}</span>
                                </div>
                            )}
                             {crop.variety && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500 text-sm">الصنف</span>
                                    <span className="font-bold text-gray-800">{crop.variety}</span>
                                </div>
                            )}
                         </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

