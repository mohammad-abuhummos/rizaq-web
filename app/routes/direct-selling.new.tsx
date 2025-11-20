import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Header } from '~/components/Header';
import { listFarmsByUser } from '~/lib/services/farm';
import { getCropsByFarm } from '~/lib/services/crop';
import { createDirectListing } from '~/lib/services/direct';
import { getAuthUser } from '~/lib/storage/auth-storage';

const UNITS = [
    { label: 'كيلوغرام (كجم)', value: 'kg' },
    { label: 'طن', value: 'ton' },
    { label: 'صندوق', value: 'box' },
    { label: 'كيس', value: 'bag' },
    { label: 'قطعة', value: 'piece' },
    { label: 'حزمة', value: 'bundle' },
    { label: 'ليتر', value: 'liter' },
];

export default function CreateDirectListing() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const createdFarmId = searchParams.get('createdFarmId');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<number | null>(null);

    // Data
    const [farms, setFarms] = useState<any[]>([]);
    const [crops, setCrops] = useState<any[]>([]);
    const [loadingFarms, setLoadingFarms] = useState(true);

    // Form
    const [selectedFarmId, setSelectedFarmId] = useState<string>('');
    const [selectedCropId, setSelectedCropId] = useState<string>('');
    const [formData, setFormData] = useState({
        title: '',
        unit: '',
        unitPrice: '',
        availableQty: '',
        minOrderQty: '',
        maxOrderQty: '',
        location: '',
    });

    // 1. Load User & Farms
    useEffect(() => {
        getAuthUser().then((auth: any) => {
            if (auth?.userId || auth?.id) {
                const uid = Number(auth.userId || auth.id);
                setUserId(uid);
                
                listFarmsByUser(uid).then((res: any) => {
                     const data = res.data || res;
                     if (Array.isArray(data)) {
                         setFarms(data);
                         if (createdFarmId) {
                             const found = data.find((f: any) => String(f.farmLandId || f.id) === String(createdFarmId));
                             if (found) setSelectedFarmId(String(found.farmLandId || found.id));
                         }
                     }
                }).catch(err => setError(err.message))
                  .finally(() => setLoadingFarms(false));
            } else {
                 alert("يرجى تسجيل الدخول");
                 navigate('/login');
            }
        });
    }, [createdFarmId, navigate]);

    // 2. Load Crops when Farm Selected
    useEffect(() => {
        if (!selectedFarmId) {
            setCrops([]);
            return;
        }
        getCropsByFarm(Number(selectedFarmId)).then((res: any) => {
            const data = res.data || res;
            if (Array.isArray(data)) setCrops(data);
        }).catch(() => setCrops([]));
    }, [selectedFarmId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;
        if (!selectedCropId) return alert("اختر محصولاً");
        if (!formData.unit) return alert("اختر الوحدة");
        
        const selectedCrop = crops.find(c => String(c.cropId || c.id) === selectedCropId);

        setLoading(true);
        setError(null);
        try {
             const dto = {
                sellerUserId: userId,
                title: formData.title,
                cropId: Number(selectedCropId),
                cropName: selectedCrop?.name || selectedCrop?.product?.nameAr || selectedCrop?.product?.nameEn,
                unit: formData.unit,
                unitPrice: Number(formData.unitPrice),
                availableQty: Number(formData.availableQty),
                minOrderQty: Number(formData.minOrderQty),
                maxOrderQty: formData.maxOrderQty ? Number(formData.maxOrderQty) : undefined,
                location: formData.location || undefined,
             };

             await createDirectListing(dto);
             alert("تم إنشاء العرض بنجاح");
             navigate('/direct-selling');
        } catch (e: any) {
            setError(e.message || "فشل الإنشاء");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (loadingFarms) return <div className="p-10 text-center">جاري التحميل...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header />
            <div className="max-w-3xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">إنشاء عرض بيع مباشر</h1>
                
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
                    {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

                    {/* Selection Section */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">المزرعة</label>
                            <select 
                                className="w-full p-3 rounded-xl border border-gray-300"
                                value={selectedFarmId}
                                onChange={(e) => { setSelectedFarmId(e.target.value); setSelectedCropId(''); }}
                                required
                            >
                                <option value="">اختر مزرعة...</option>
                                {farms.map(f => (
                                    <option key={f.farmLandId || f.id} value={f.farmLandId || f.id}>{f.name}</option>
                                ))}
                            </select>
                            {farms.length === 0 && <p className="text-xs text-red-500 mt-1">لا توجد مزارع متاحة</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">المحصول</label>
                            <select 
                                className="w-full p-3 rounded-xl border border-gray-300"
                                value={selectedCropId}
                                onChange={(e) => setSelectedCropId(e.target.value)}
                                required
                                disabled={!selectedFarmId}
                            >
                                <option value="">اختر محصول...</option>
                                {crops.map(c => (
                                    <option key={c.cropId || c.id} value={c.cropId || c.id}>
                                        {c.name || c.product?.nameAr} ({c.quantity} {c.unit})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">العنوان (اختياري)</label>
                            <input 
                                type="text" 
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="مثال: طماطم طازجة درجة أولى"
                                className="w-full p-3 rounded-xl border border-gray-300"
                            />
                        </div>

                         <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">الوحدة</label>
                                <select 
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 rounded-xl border border-gray-300"
                                >
                                    <option value="">اختر الوحدة...</option>
                                    {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">السعر للوحدة (ل.س)</label>
                                <input 
                                    type="number" 
                                    name="unitPrice"
                                    value={formData.unitPrice}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 rounded-xl border border-gray-300"
                                />
                            </div>
                         </div>

                         <div className="grid md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">الكمية المتاحة</label>
                                <input 
                                    type="number" 
                                    name="availableQty"
                                    value={formData.availableQty}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 rounded-xl border border-gray-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">أقل طلب</label>
                                <input 
                                    type="number" 
                                    name="minOrderQty"
                                    value={formData.minOrderQty}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 rounded-xl border border-gray-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">أقصى طلب (اختياري)</label>
                                <input 
                                    type="number" 
                                    name="maxOrderQty"
                                    value={formData.maxOrderQty}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded-xl border border-gray-300"
                                />
                            </div>
                         </div>

                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">الموقع (اختياري)</label>
                            <input 
                                type="text" 
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="مثال: دمشق"
                                className="w-full p-3 rounded-xl border border-gray-300"
                            />
                         </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg ${loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
                    >
                        {loading ? "جاري الإنشاء..." : "نشر العرض"}
                    </button>
                </form>
            </div>
        </div>
    );
}

