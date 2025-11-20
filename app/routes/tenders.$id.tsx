import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Header } from '~/components/Header';
import { getTender, listTendersCreatedByUser, awardTender } from '~/lib/services/tender';
import { listOffersByTender, createOffer } from '~/lib/services/offer';
import { getAuthUser } from '~/lib/storage/auth-storage';
import type { Tender } from '~/lib/types/tender';
import type { Offer } from '~/lib/types/offer';

export default function TenderDetail() {
    const { id } = useParams<{ id: string }>();
    const tenderId = Number(id);
    const navigate = useNavigate();
    
    const [tender, setTender] = useState<Tender | null>(null);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<number | null>(null);
    const [isOwner, setIsOwner] = useState(false);

    // Offer Form
    const [offerPrice, setOfferPrice] = useState('');
    const [offerDesc, setOfferDesc] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        getAuthUser().then((u: any) => {
            if (u?.userId || u?.id) setUserId(Number(u.userId || u.id));
        });
    }, []);

    const fetchData = async () => {
        if (!tenderId) return;
        try {
            const [tRes, oRes] = await Promise.all([getTender(tenderId), listOffersByTender(tenderId)]);
            const tData = (tRes as any)?.data ?? tRes;
            const oData = (oRes as any)?.data ?? oRes;
            
            setTender(tData);
            setOffers(Array.isArray(oData) ? oData : []);

            // Check ownership
            const auth = await getAuthUser<{ userId?: number; id?: number }>();
            const uid = auth?.userId || auth?.id;
            if (uid && tData?.createdByUserId) {
                setIsOwner(String(tData.createdByUserId) === String(uid));
            }

        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [tenderId]);

    const handleSubmitOffer = async () => {
        if (!userId) return alert("سجل الدخول أولاً");
        if (!offerPrice) return alert("أدخل السعر");
        
        setSubmitting(true);
        try {
            await createOffer(userId, {
                tenderId,
                price: Number(offerPrice),
                description: offerDesc
            });
            alert("تم إرسال العرض");
            setOfferPrice('');
            setOfferDesc('');
            fetchData(); // Refresh offers
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAward = async (offerId: number) => {
        if (!confirm("هل أنت متأكد من قبول هذا العرض؟")) return;
        try {
            await awardTender(tenderId, offerId);
            alert("تم قبول العرض");
            fetchData();
        } catch (e: any) {
            alert(e.message);
        }
    };

    if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;
    if (error || !tender) return <div className="p-10 text-center text-red-600">{error || "خطأ"}</div>;

    const isAwarded = tender.status === 'awarded' || !!tender.awardedOfferId;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header />
            <div className="max-w-5xl mx-auto px-4 py-8">
                <button onClick={() => navigate(-1)} className="mb-6 text-gray-600">← عودة</button>
                
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Tender Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200 relative overflow-hidden">
                            {isAwarded && <div className="absolute top-0 left-0 right-0 bg-green-600 text-white text-center py-1 font-bold text-sm">مكتملة (تم الإسناد)</div>}
                            
                            <h1 className="text-3xl font-bold text-gray-900 mb-2 mt-4">{tender.title}</h1>
                            <p className="text-gray-500 mb-6">{tender.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                <div className="p-4 bg-gray-50 rounded-xl text-center">
                                    <div className="text-xs text-gray-500">الكمية</div>
                                    <div className="font-bold text-gray-800">{tender.quantity} {tender.unit}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl text-center">
                                    <div className="text-xs text-gray-500">الميزانية</div>
                                    <div className="font-bold text-green-600">{tender.maxBudget?.toLocaleString() || '-'}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl text-center">
                                    <div className="text-xs text-gray-500">الإغلاق</div>
                                    <div className="font-bold text-gray-800">{new Date(tender.endTime).toLocaleDateString('ar-EG')}</div>
                                </div>
                            </div>

                            {/* Offers List (For Owner) */}
                            {isOwner ? (
                                <div className="mt-8">
                                    <h3 className="text-xl font-bold mb-4 border-b pb-2">العروض المقدمة ({offers.length})</h3>
                                    <div className="space-y-4">
                                        {offers.length === 0 && <p className="text-gray-500">لا توجد عروض بعد.</p>}
                                        {offers.map(offer => {
                                            const offerId = (offer as any).offerId || (offer as any).id;
                                            const price = (offer as any).offeredPrice || (offer as any).price;
                                            const isWinner = tender.awardedOfferId === offerId || (tender.awardedOfferIds && tender.awardedOfferIds.includes(offerId));
                                            
                                            return (
                                                <div key={offerId} className={`p-4 rounded-xl border flex justify-between items-center ${isWinner ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
                                                    <div>
                                                        <div className="font-bold text-lg text-gray-900">{price?.toLocaleString()} ل.س</div>
                                                        <div className="text-sm text-gray-500">{offer.description || "بدون وصف"}</div>
                                                        {isWinner && <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">🏆 فائز</span>}
                                                    </div>
                                                    {!isAwarded && (
                                                        <button 
                                                            onClick={() => handleAward(offerId)}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700"
                                                        >
                                                            قبول
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                !isAwarded && (
                                    <div className="mt-8 pt-8 border-t border-gray-100">
                                        <h3 className="text-xl font-bold mb-4">تقديم عرض</h3>
                                        <div className="space-y-4">
                                            <input 
                                                type="number" 
                                                placeholder="السعر المقترح (ل.س)" 
                                                value={offerPrice}
                                                onChange={(e) => setOfferPrice(e.target.value)}
                                                className="w-full p-3 rounded-xl border border-gray-300"
                                            />
                                            <textarea 
                                                placeholder="تفاصيل العرض (اختياري)" 
                                                value={offerDesc}
                                                onChange={(e) => setOfferDesc(e.target.value)}
                                                className="w-full p-3 rounded-xl border border-gray-300"
                                                rows={3}
                                            />
                                            <button 
                                                onClick={handleSubmitOffer}
                                                disabled={submitting}
                                                className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
                                            >
                                                {submitting ? "جاري الإرسال..." : "إرسال العرض"}
                                            </button>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                            <h3 className="font-bold mb-4">معلومات إضافية</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex justify-between">
                                    <span className="text-gray-500">المحصول</span>
                                    <span className="font-bold">{tender.cropName}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-gray-500">تاريخ البدء</span>
                                    <span className="font-bold">{new Date(tender.startTime).toLocaleDateString('ar-EG')}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-gray-500">التسليم من</span>
                                    <span className="font-bold">{new Date(tender.deliveryFrom).toLocaleDateString('ar-EG')}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-gray-500">التسليم إلى</span>
                                    <span className="font-bold">{new Date(tender.deliveryTo).toLocaleDateString('ar-EG')}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-gray-500">موقع التسليم</span>
                                    <span className="font-bold">{tender.deliveryLocation || '-'}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

