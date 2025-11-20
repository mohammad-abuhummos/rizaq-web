import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Header } from '~/components/Header';
import { getDirectListing, createDirectOrder } from '~/lib/services/direct';
import { getAuthUser } from '~/lib/storage/auth-storage';
import type { DirectListing } from '~/lib/types/direct';

const PAYMENT_METHODS = [
    { id: 'card', label: 'بطاقة بنكية', icon: '💳' },
    { id: 'wallet', label: 'محفظة إلكترونية', icon: '📱' },
];

export default function DirectSellingDetail() {
    const { id } = useParams<{ id: string }>();
    const listingId = Number(id);
    const navigate = useNavigate();
    
    const [listing, setListing] = useState<DirectListing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [buyerId, setBuyerId] = useState<number | null>(null);

    // Order Form
    const [qty, setQty] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        getAuthUser().then((u: any) => {
            if (u?.userId || u?.id) setBuyerId(Number(u.userId || u.id));
        });
    }, []);

    useEffect(() => {
        if (!listingId) return;
        setLoading(true);
        getDirectListing(listingId).then((res: any) => {
            const data = res.data || res;
            if (data) {
                setListing(data);
                setQty(String(data.minOrderQty || 1));
            } else {
                setError("العرض غير موجود");
            }
        }).catch((e) => setError(e.message))
          .finally(() => setLoading(false));
    }, [listingId]);

    const handleBuy = async () => {
        if (!buyerId) return alert("يرجى تسجيل الدخول");
        if (!qty || Number(qty) <= 0) return alert("الكمية غير صالحة");
        if (!address) return alert("أدخل العنوان");
        if (!paymentMethod) return alert("اختر طريقة الدفع");

        setSubmitting(true);
        try {
            const methodLabel = PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label || 'Unknown';
            await createDirectOrder({
                listingId,
                buyerUserId: buyerId,
                qty: Number(qty),
                deliveryAddress: address,
                paymentMethod: methodLabel,
            });
            alert("تم إرسال الطلب بنجاح!");
            navigate('/direct-selling'); // Or to orders page if exists
        } catch (e: any) {
            alert(e.message || "فشل الطلب");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;
    if (error || !listing) return <div className="p-10 text-center text-red-600">{error || "خطأ"}</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button onClick={() => navigate(-1)} className="mb-6 text-gray-600 flex items-center gap-1">← عودة</button>
                
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Listing Details */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">{listing.title || listing.cropName}</h1>
                            <p className="text-gray-500 mb-4">{listing.cropName}</p>
                            
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6">
                                <span className="text-blue-800 font-bold">السعر</span>
                                <span className="text-2xl font-bold text-blue-700">{listing.unitPrice?.toLocaleString()} ل.س <span className="text-sm font-normal">/ {listing.unit}</span></span>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-500">الكمية المتاحة</span>
                                    <span className="font-bold">{listing.availableQty} {listing.unit}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-500">الحد الأدنى</span>
                                    <span className="font-bold">{listing.minOrderQty} {listing.unit}</span>
                                </div>
                                {listing.maxOrderQty && (
                                    <div className="flex justify-between border-b border-gray-50 pb-2">
                                        <span className="text-gray-500">الحد الأقصى</span>
                                        <span className="font-bold">{listing.maxOrderQty} {listing.unit}</span>
                                    </div>
                                )}
                                {listing.location && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">الموقع</span>
                                        <span className="font-bold">{listing.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Form */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 h-fit">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">إتمام الشراء</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">الكمية المطلوبة ({listing.unit})</label>
                                <input 
                                    type="number" 
                                    value={qty}
                                    onChange={(e) => setQty(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-300"
                                    min={listing.minOrderQty}
                                    max={listing.maxOrderQty || listing.availableQty}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">عنوان التوصيل</label>
                                <textarea 
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-300"
                                    placeholder="المدينة، المنطقة، تفاصيل الشارع..."
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">طريقة الدفع</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {PAYMENT_METHODS.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setPaymentMethod(m.id)}
                                            className={`p-3 rounded-xl border text-center transition-all ${paymentMethod === m.id ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-600'}`}
                                        >
                                            <div className="text-xl mb-1">{m.icon}</div>
                                            <div className="text-sm font-bold">{m.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold text-gray-700">الإجمالي التقديري</span>
                                    <span className="text-xl font-bold text-green-600">{(Number(qty || 0) * (listing.unitPrice || 0)).toLocaleString()} ل.س</span>
                                </div>
                                <button 
                                    onClick={handleBuy}
                                    disabled={submitting}
                                    className={`w-full py-3 rounded-xl text-white font-bold ${submitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                    {submitting ? 'جاري الطلب...' : 'تأكيد الطلب'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

