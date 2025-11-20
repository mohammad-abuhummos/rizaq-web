import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '~/components/Header';
import { listFarmsByUser } from '~/lib/services/farm';
import { getCropsByFarm } from '~/lib/services/crop';
import { createAuction } from '~/lib/services/auction';
import { getAuthUser } from '~/lib/storage/auth-storage';

export default function CreateAuction() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Data
    const [farms, setFarms] = useState<any[]>([]);
    const [crops, setCrops] = useState<any[]>([]);
    const [loadingFarms, setLoadingFarms] = useState(true);
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

    // User
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        setLoadingFarms(true);
        getAuthUser().then((auth: any) => {
            if (auth?.userId || auth?.id) {
                const uid = Number(auth.userId || auth.id);
                setUserId(uid);
                // Load Farms
                listFarmsByUser(uid).then((res: any) => {
                     const data = res.data || res;
                     if (Array.isArray(data)) setFarms(data);
                }).catch(console.error)
                  .finally(() => setLoadingFarms(false));
            } else {
                 alert("يرجى تسجيل الدخول");
                 navigate('/login');
            }
        });
    }, [navigate]);

    useEffect(() => {
        if (!selectedFarmId) {
            setCrops([]);
            return;
        }
        setLoadingCrops(true);
        getCropsByFarm(Number(selectedFarmId)).then((res: any) => {
            const data = res.data || res;
            if (Array.isArray(data)) {
                // Only show available crops
                const availableCrops = data.filter(c => c.status === 'available');
                setCrops(availableCrops);
            }
        }).catch(() => setCrops([]))
          .finally(() => setLoadingCrops(false));
    }, [selectedFarmId]);

    // Set default times
    useEffect(() => {
        if (!formData.startTime) {
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            setFormData(prev => ({
                ...prev,
                startTime: now.toISOString().slice(0, 16),
                endTime: tomorrow.toISOString().slice(0, 16),
            }));
        }
    }, [formData.startTime]);

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!selectedFarmId) errors.farm = 'يرجى اختيار مزرعة';
        if (!selectedCropId) errors.crop = 'يرجى اختيار محصول';
        if (!formData.startingPrice || Number(formData.startingPrice) <= 0) {
            errors.startingPrice = 'يرجى إدخال سعر ابتدائي صحيح';
        }
        if (!formData.minIncrement || Number(formData.minIncrement) <= 0) {
            errors.minIncrement = 'يرجى إدخال حد أدنى للزيادة صحيح';
        }
        if (!formData.startTime) errors.startTime = 'يرجى تحديد وقت البداية';
        if (!formData.endTime) errors.endTime = 'يرجى تحديد وقت النهاية';
        
        if (formData.startTime && formData.endTime) {
            if (new Date(formData.endTime) <= new Date(formData.startTime)) {
                errors.endTime = 'وقت النهاية يجب أن يكون بعد وقت البداية';
            }
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
             const dto = {
                auctionTitle: formData.title || undefined,
                auctionDescription: formData.description || undefined,
                startingPrice: Number(formData.startingPrice),
                minIncrement: Number(formData.minIncrement),
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
                cropId: Number(selectedCropId),
             };

             const res = await createAuction(userId, dto);
             if (res.success || res.auctionId || (res as any).data?.auctionId) {
                 const id = (res as any).data?.auctionId || res.auctionId || (res as any).id;
                 if (id) navigate(`/auctions/${id}/join`);
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
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear field error when user types
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const showNoFarmsScreen = !loadingFarms && farms.length === 0;
    const showNoCropsScreen = selectedFarmId && !loadingCrops && crops.length === 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header />
            
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-lg p-8 mb-8 text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">إنشاء مزاد جديد</h1>
                    <p className="text-green-50 text-lg">املأ التفاصيل لإنشاء مزاد لمحصولك</p>
                </div>

                {/* No Farms Screen */}
                {showNoFarmsScreen && (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">لا توجد مزارع متاحة</h2>
                            <p className="text-gray-600 mb-8">
                                تحتاج إلى إنشاء مزرعة قبل أن تتمكن من إنشاء مزاد. تُستخدم المزارع لإدارة محاصيلك.
                            </p>
                            <button
                                onClick={() => navigate('/farms/new')}
                                className="px-8 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                            >
                                إنشاء أول مزرعة
                            </button>
                        </div>
                    </div>
                )}

                {/* No Crops Screen */}
                {showNoCropsScreen && (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">لا توجد محاصيل متاحة</h2>
                            <p className="text-gray-600 mb-8">
                                المزرعة المحددة ليس بها محاصيل متاحة. تحتاج إلى إنشاء محصول قبل أن تتمكن من إنشاء مزاد.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => navigate(`/crops/new?farmId=${selectedFarmId}`)}
                                    className="px-8 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                                >
                                    إنشاء محصول
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedFarmId('');
                                        setSelectedCropId('');
                                        setFieldErrors({});
                                    }}
                                    className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
                                >
                                    اختر مزرعة أخرى
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Form */}
                {!showNoFarmsScreen && !showNoCropsScreen && (
                    <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-start gap-3">
                                <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="flex-1">{error}</span>
                            </div>
                        )}

                        {/* Loading Farms */}
                        {loadingFarms && (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                                <span className="mr-4 text-gray-600">جاري تحميل المزارع...</span>
                            </div>
                        )}

                        {!loadingFarms && (
                            <>
                                {/* Step 1: Farm & Crop Selection */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                                            ١
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-800">اختيار المحصول</h2>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Farm Select */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                المزرعة <span className="text-red-500">*</span>
                                            </label>
                                            <select 
                                                className={`w-full p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-4 focus:ring-green-100 ${
                                                    fieldErrors.farm 
                                                        ? 'border-red-300 bg-red-50' 
                                                        : 'border-gray-300 focus:border-green-500'
                                                }`}
                                                value={selectedFarmId}
                                                onChange={(e) => { 
                                                    setSelectedFarmId(e.target.value); 
                                                    setSelectedCropId(''); 
                                                    setFieldErrors(prev => {
                                                        const newErrors = { ...prev };
                                                        delete newErrors.farm;
                                                        delete newErrors.crop;
                                                        return newErrors;
                                                    });
                                                }}
                                                required
                                            >
                                                <option value="">اختر مزرعة...</option>
                                                {farms.map(f => (
                                                    <option key={f.farmLandId || f.id} value={f.farmLandId || f.id}>
                                                        {f.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {fieldErrors.farm && (
                                                <p className="text-red-600 text-sm mt-2">{fieldErrors.farm}</p>
                                            )}
                                        </div>

                                        {/* Crop Select */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                المحصول <span className="text-red-500">*</span>
                                            </label>
                                            <select 
                                                className={`w-full p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-4 focus:ring-green-100 ${
                                                    fieldErrors.crop 
                                                        ? 'border-red-300 bg-red-50' 
                                                        : 'border-gray-300 focus:border-green-500'
                                                } ${(!selectedFarmId || loadingCrops) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                value={selectedCropId}
                                                onChange={(e) => {
                                                    setSelectedCropId(e.target.value);
                                                    setFieldErrors(prev => {
                                                        const newErrors = { ...prev };
                                                        delete newErrors.crop;
                                                        return newErrors;
                                                    });
                                                }}
                                                required
                                                disabled={!selectedFarmId || loadingCrops}
                                            >
                                                <option value="">{loadingCrops ? "جاري التحميل..." : "اختر محصول..."}</option>
                                                {crops.map(c => (
                                                    <option key={c.cropId || c.id} value={c.cropId || c.id}>
                                                        {c.name} - {c.quantity} {c.unit}
                                                    </option>
                                                ))}
                                            </select>
                                            {fieldErrors.crop && (
                                                <p className="text-red-600 text-sm mt-2">{fieldErrors.crop}</p>
                                            )}
                                            {selectedFarmId && !loadingCrops && crops.length === 0 && (
                                                <p className="text-orange-600 text-sm mt-2">
                                                    لا توجد محاصيل متاحة في هذه المزرعة
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2: Auction Details */}
                                <div className="space-y-6 pt-6 border-t">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                                            ٢
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-800">تفاصيل المزاد</h2>
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">عنوان المزاد</label>
                                        <input 
                                            type="text" 
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="مثال: محصول قمح ممتاز من مزرعتي"
                                            className="w-full p-4 rounded-xl border-2 border-gray-300 focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-100 transition-all"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">اختياري - سيتم استخدام اسم المحصول إذا تركته فارغاً</p>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
                                        <textarea 
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={4}
                                            placeholder="اكتب وصفاً تفصيلياً للمزاد والمحصول..."
                                            className="w-full p-4 rounded-xl border-2 border-gray-300 focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-100 transition-all resize-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">اختياري</p>
                                    </div>

                                    {/* Pricing */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                السعر الابتدائي (ل.س) <span className="text-red-500">*</span>
                                            </label>
                                            <input 
                                                type="number" 
                                                name="startingPrice"
                                                value={formData.startingPrice}
                                                onChange={handleChange}
                                                required
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                className={`w-full p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-4 focus:ring-green-100 ${
                                                    fieldErrors.startingPrice 
                                                        ? 'border-red-300 bg-red-50' 
                                                        : 'border-gray-300 focus:border-green-500'
                                                }`}
                                            />
                                            {fieldErrors.startingPrice && (
                                                <p className="text-red-600 text-sm mt-2">{fieldErrors.startingPrice}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                الحد الأدنى للزيادة (ل.س) <span className="text-red-500">*</span>
                                            </label>
                                            <input 
                                                type="number" 
                                                name="minIncrement"
                                                value={formData.minIncrement}
                                                onChange={handleChange}
                                                required
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                className={`w-full p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-4 focus:ring-green-100 ${
                                                    fieldErrors.minIncrement 
                                                        ? 'border-red-300 bg-red-50' 
                                                        : 'border-gray-300 focus:border-green-500'
                                                }`}
                                            />
                                            {fieldErrors.minIncrement && (
                                                <p className="text-red-600 text-sm mt-2">{fieldErrors.minIncrement}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3: Timing */}
                                <div className="space-y-6 pt-6 border-t">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                                            ٣
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-800">توقيت المزاد</h2>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                وقت البداية <span className="text-red-500">*</span>
                                            </label>
                                            <input 
                                                type="datetime-local" 
                                                name="startTime"
                                                value={formData.startTime}
                                                onChange={handleChange}
                                                required
                                                className={`w-full p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-4 focus:ring-green-100 ${
                                                    fieldErrors.startTime 
                                                        ? 'border-red-300 bg-red-50' 
                                                        : 'border-gray-300 focus:border-green-500'
                                                }`}
                                            />
                                            {fieldErrors.startTime && (
                                                <p className="text-red-600 text-sm mt-2">{fieldErrors.startTime}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                وقت النهاية <span className="text-red-500">*</span>
                                            </label>
                                            <input 
                                                type="datetime-local" 
                                                name="endTime"
                                                value={formData.endTime}
                                                onChange={handleChange}
                                                required
                                                className={`w-full p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-4 focus:ring-green-100 ${
                                                    fieldErrors.endTime 
                                                        ? 'border-red-300 bg-red-50' 
                                                        : 'border-gray-300 focus:border-green-500'
                                                }`}
                                            />
                                            {fieldErrors.endTime && (
                                                <p className="text-red-600 text-sm mt-2">{fieldErrors.endTime}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="pt-8 border-t">
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className={`w-full py-5 rounded-xl text-white font-bold text-xl shadow-lg transition-all transform ${
                                            loading 
                                                ? "bg-gray-400 cursor-not-allowed" 
                                                : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-xl hover:scale-[1.01]"
                                        }`}
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-3">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                                جاري إنشاء المزاد...
                                            </span>
                                        ) : (
                                            "إنشاء المزاد 🔨"
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}
