import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '~/components/Header';
import { listFarmsByUser } from '~/lib/services/farm';
import { getCropsByFarm } from '~/lib/services/crop';
import { listProducts } from '~/lib/services/product';
import { createTender } from '~/lib/services/tender';
import { getAuthUser } from '~/lib/storage/auth-storage';

export default function CreateTender() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<number | null>(null);

    // Data
    const [products, setProducts] = useState<any[]>([]);
    const [farms, setFarms] = useState<any[]>([]);
    const [crops, setCrops] = useState<any[]>([]);

    // Form
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [selectedFarmId, setSelectedFarmId] = useState<string>('');
    const [selectedCropId, setSelectedCropId] = useState<string>('');
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        quantity: '',
        unit: '',
        maxBudget: '',
        deliveryLocation: '',
        deliveryFrom: '',
        deliveryTo: '',
        startTime: '',
        endTime: '',
    });

    // Load Initial Data
    useEffect(() => {
        getAuthUser().then((auth: any) => {
            if (auth?.userId || auth?.id) {
                const uid = Number(auth.userId || auth.id);
                setUserId(uid);
                listFarmsByUser(uid).then((res: any) => {
                    setFarms(Array.isArray(res?.data || res) ? (res?.data || res) : []);
                });
            } else {
                 navigate('/login');
            }
        });

        listProducts().then((res: any) => {
            setProducts(Array.isArray(res?.data || res) ? (res?.data || res) : []);
        });
    }, []);

    // Load Crops
    useEffect(() => {
        if (!selectedFarmId) {
            setCrops([]);
            return;
        }
        getCropsByFarm(Number(selectedFarmId)).then((res: any) => {
            setCrops(Array.isArray(res?.data || res) ? (res?.data || res) : []);
        });
    }, [selectedFarmId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;
        if (!selectedProductId) return alert("اختر المنتج");
        if (!selectedCropId) return alert("اختر المحصول");

        setLoading(true);
        try {
            const selectedCrop = crops.find(c => String(c.cropId || c.id) === selectedCropId);
            
            const dto = {
                ...formData,
                quantity: Number(formData.quantity),
                maxBudget: formData.maxBudget ? Number(formData.maxBudget) : undefined,
                productId: Number(selectedProductId),
                cropId: Number(selectedCropId),
                cropName: selectedCrop?.name || selectedCrop?.product?.nameAr,
                deliveryFrom: new Date(formData.deliveryFrom).toISOString(),
                deliveryTo: new Date(formData.deliveryTo).toISOString(),
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
            };

            await createTender(userId, dto);
            alert("تم إنشاء المناقصة بنجاح");
            navigate('/tenders');
        } catch (e: any) {
            setError(e.message || "فشل الإنشاء");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header />
            <div className="max-w-3xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">إنشاء مناقصة جديدة</h1>
                
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
                    {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

                    {/* Product Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">المنتج المطلوب</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-40 overflow-y-auto custom-scrollbar">
                            {products.map(p => (
                                <button
                                    type="button"
                                    key={p.productId}
                                    onClick={() => setSelectedProductId(String(p.productId))}
                                    className={`p-3 rounded-xl border text-center text-sm font-bold ${String(p.productId) === selectedProductId ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200'}`}
                                >
                                    {p.nameAr || p.nameEn}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Farm & Crop */}
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
                                {farms.map(f => <option key={f.farmLandId || f.id} value={f.farmLandId || f.id}>{f.name}</option>)}
                            </select>
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
                                {crops.map(c => <option key={c.cropId || c.id} value={c.cropId || c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">عنوان المناقصة</label>
                            <input type="text" name="title" onChange={handleChange} required className="w-full p-3 rounded-xl border border-gray-300" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
                            <textarea name="description" onChange={handleChange} className="w-full p-3 rounded-xl border border-gray-300" rows={3} />
                        </div>
                        <div className="grid md:grid-cols-2 gap-5">
                             <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">الكمية</label>
                                <input type="number" name="quantity" onChange={handleChange} required className="w-full p-3 rounded-xl border border-gray-300" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">الوحدة</label>
                                <input type="text" name="unit" placeholder="طن، كغ..." onChange={handleChange} required className="w-full p-3 rounded-xl border border-gray-300" />
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2">الميزانية القصوى (ل.س)</label>
                             <input type="number" name="maxBudget" onChange={handleChange} className="w-full p-3 rounded-xl border border-gray-300" />
                        </div>
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2">موقع التسليم</label>
                             <input type="text" name="deliveryLocation" onChange={handleChange} className="w-full p-3 rounded-xl border border-gray-300" />
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-5">
                        <h3 className="font-bold text-lg border-b pb-2">التواريخ</h3>
                        <div className="grid md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">التسليم من</label>
                                <input type="datetime-local" name="deliveryFrom" onChange={handleChange} required className="w-full p-3 rounded-xl border border-gray-300" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">التسليم إلى</label>
                                <input type="datetime-local" name="deliveryTo" onChange={handleChange} required className="w-full p-3 rounded-xl border border-gray-300" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">بدء المناقصة</label>
                                <input type="datetime-local" name="startTime" onChange={handleChange} required className="w-full p-3 rounded-xl border border-gray-300" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">نهاية المناقصة</label>
                                <input type="datetime-local" name="endTime" onChange={handleChange} required className="w-full p-3 rounded-xl border border-gray-300" />
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg ${loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
                    >
                        {loading ? "جاري الإنشاء..." : "إنشاء المناقصة"}
                    </button>
                </form>
            </div>
        </div>
    );
}

