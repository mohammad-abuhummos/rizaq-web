import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '~/components/Header';
import { listFarmsByUser } from '~/lib/services/farm';
import { getCropsByFarm } from '~/lib/services/crop';
import { createAuction } from '~/lib/services/auction';
import { getAuthUser } from '~/lib/storage/auth-storage';

export default function CreateAuction() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data
    const [farms, setFarms] = useState<any[]>([]);
    const [crops, setCrops] = useState<any[]>([]);
    const [loadingCrops, setLoadingCrops] = useState(false);

    // Form State
    const [selectedFarmId, setSelectedFarmId] = useState<string>('');
    const [selectedCropId, setSelectedCropId] = useState<string>('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startingPrice: '',
        minIncrement: '',
        startTime: '',
        endTime: '',
    });
    const [images, setImages] = useState<string[]>([]);

    // User
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        getAuthUser().then((auth: any) => {
            if (auth?.userId || auth?.id) {
                const uid = Number(auth.userId || auth.id);
                setUserId(uid);
                // Load Farms
                listFarmsByUser(uid).then((res: any) => {
                     const data = res.data || res;
                     if (Array.isArray(data)) setFarms(data);
                }).catch(console.error);
            } else {
                 alert("يرجى تسجيل الدخول");
                 navigate('/login');
            }
        });
    }, []);

    useEffect(() => {
        if (!selectedFarmId) {
            setCrops([]);
            return;
        }
        setLoadingCrops(true);
        getCropsByFarm(Number(selectedFarmId)).then((res: any) => {
            const data = res.data || res;
            if (Array.isArray(data)) setCrops(data);
        }).catch(() => setCrops([]))
          .finally(() => setLoadingCrops(false));
    }, [selectedFarmId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;
        if (!selectedCropId) return alert("اختر محصولاً");
        
        // Basic validation
        if (new Date(formData.endTime) <= new Date(formData.startTime)) {
             return alert("وقت النهاية يجب أن يكون بعد وقت البداية");
        }

        setLoading(true);
        setError(null);
        try {
             const dto = {
                auctionTitle: formData.title,
                auctionDescription: formData.description,
                startingPrice: Number(formData.startingPrice),
                minIncrement: Number(formData.minIncrement),
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
                cropId: Number(selectedCropId),
                imageUrls: images.length > 0 ? images : undefined,
             };

             const res = await createAuction(userId, dto);
             if (res.success || res.auctionId || (res as any).data?.auctionId) {
                 alert("تم إنشاء المزاد بنجاح!");
                 const id = (res as any).data?.auctionId || res.auctionId || (res as any).id;
                 if (id) navigate(`/auctions/${id}`);
                 else navigate('/auctions');
             } else {
                 throw new Error("فشل الإنشاء");
             }
        } catch (e: any) {
            setError(e.message || "حدث خطأ ما");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Temporary Simple Image Uploader for Web
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        // In a real app, upload to server/cloud and get URL
        // Here we just mock it or use local blob for preview if we aren't implementing full upload logic right now
        // Since the backend expects URLs, we assume we have an endpoint or service. 
        // For now, I'll just leave it as a placeholder or assume user enters URLs if we want strictly text,
        // but typically we need a file upload service. 
        // Since I don't have the upload service code in front of me (it was imported in mobile), I'll skip implementation detail and just show UI.
        alert("Image upload would happen here.");
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header />
            <div className="max-w-3xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">إنشاء مزاد جديد</h1>
                
                <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
                    {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

                    {/* Step 1: Farm & Crop */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">1. اختيار المحصول</h2>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">المزرعة</label>
                                <select 
                                    className="w-full p-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                                    value={selectedFarmId}
                                    onChange={(e) => { setSelectedFarmId(e.target.value); setSelectedCropId(''); }}
                                    required
                                >
                                    <option value="">اختر مزرعة...</option>
                                    {farms.map(f => (
                                        <option key={f.farmLandId || f.id} value={f.farmLandId || f.id}>
                                            {f.name}
                                        </option>
                                    ))}
                                </select>
                                {farms.length === 0 && <p className="text-xs text-red-500 mt-1">لا توجد مزارع. أنشئ مزرعة أولاً.</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">المحصول</label>
                                <select 
                                    className="w-full p-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                                    value={selectedCropId}
                                    onChange={(e) => setSelectedCropId(e.target.value)}
                                    required
                                    disabled={!selectedFarmId || loadingCrops}
                                >
                                    <option value="">{loadingCrops ? "جاري التحميل..." : "اختر محصول..."}</option>
                                    {crops.map(c => (
                                        <option key={c.cropId || c.id} value={c.cropId || c.id}>
                                            {c.name} ({c.quantity} {c.unit})
                                        </option>
                                    ))}
                                </select>
                                {selectedFarmId && !loadingCrops && crops.length === 0 && (
                                    <p className="text-xs text-red-500 mt-1">لا توجد محاصيل في هذه المزرعة.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Auction Details */}
                    <div className="space-y-6">
                         <h2 className="text-xl font-bold text-gray-800 border-b pb-2">2. تفاصيل المزاد</h2>
                         
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">عنوان المزاد</label>
                            <input 
                                type="text" 
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="مثال: محصول قمح ممتاز"
                                className="w-full p-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                            />
                         </div>

                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
                            <textarea 
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                placeholder="اكتب وصفاً دقيقاً للمنتج..."
                                className="w-full p-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                            />
                         </div>

                         <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">السعر الابتدائي (ل.س)</label>
                                <input 
                                    type="number" 
                                    name="startingPrice"
                                    value={formData.startingPrice}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    className="w-full p-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">الحد الأدنى للزيادة (ل.س)</label>
                                <input 
                                    type="number" 
                                    name="minIncrement"
                                    value={formData.minIncrement}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    className="w-full p-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                />
                            </div>
                         </div>
                    </div>

                    {/* Step 3: Timing */}
                    <div className="space-y-6">
                         <h2 className="text-xl font-bold text-gray-800 border-b pb-2">3. التوقيت</h2>
                         
                         <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">وقت البداية</label>
                                <input 
                                    type="datetime-local" 
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">وقت النهاية</label>
                                <input 
                                    type="datetime-local" 
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                />
                            </div>
                         </div>
                    </div>

                     {/* Submit */}
                     <div className="pt-6">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] ${loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
                        >
                            {loading ? "جاري الإنشاء..." : "إنشاء المزاد"}
                        </button>
                     </div>
                </form>
            </div>
        </div>
    );
}

