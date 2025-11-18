import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Header } from '~/components/Header';
import { getAuctionById, updateAuction, listAuctionsCreatedByUser } from '~/lib/services/auction';
import { getAuthUser } from '~/lib/storage/auth-storage';
import type { AuctionDetail } from '~/lib/types/auction';

export default function EditAuction() {
    const { auctionId } = useParams<{ auctionId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [canEdit, setCanEdit] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startingPrice: '',
        minIncrement: '',
        startTime: '',
        endTime: '',
    });

    useEffect(() => {
        const fetchAuction = async () => {
            if (!auctionId) return;
            setLoading(true);
            try {
                // Auth check
                const auth = await getAuthUser<{ userId?: number; id?: number }>();
                const userId = auth?.userId || auth?.id;
                if (!userId) {
                    alert("غير مصرح");
                    navigate('/login');
                    return;
                }

                const res = await getAuctionById(Number(auctionId));
                const auction = res.data as any;
                
                // Verify ownership
                if (String(auction.createdByUserId) !== String(userId)) {
                    // Double check via list
                    try {
                        const mine = await listAuctionsCreatedByUser(userId);
                        const mines = (mine as any).data || mine;
                        if (!Array.isArray(mines) || !mines.some((a: any) => String(a.auctionId) === String(auctionId))) {
                             setError("لا تملك صلاحية تعديل هذا المزاد");
                             setLoading(false);
                             return;
                        }
                    } catch {
                        setError("لا تملك صلاحية تعديل هذا المزاد");
                        setLoading(false);
                        return;
                    }
                }

                setCanEdit(true);
                setFormData({
                    title: auction.auctionTitle || '',
                    description: auction.auctionDescription || '',
                    startingPrice: String(auction.startingPrice),
                    minIncrement: String(auction.minIncrement),
                    startTime: auction.startTime ? new Date(auction.startTime).toISOString().slice(0, 16) : '',
                    endTime: auction.endTime ? new Date(auction.endTime).toISOString().slice(0, 16) : '',
                });

            } catch (e: any) {
                setError(e.message || "فشل التحميل");
            } finally {
                setLoading(false);
            }
        };
        fetchAuction();
    }, [auctionId, navigate]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEdit) return;
        setSaving(true);
        try {
             const payload = {
                auctionId: Number(auctionId),
                auctionTitle: formData.title,
                auctionDescription: formData.description,
                startingPrice: Number(formData.startingPrice),
                minIncrement: Number(formData.minIncrement),
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
             };

             await updateAuction(Number(auctionId), payload as any);
             alert("تم التحديث بنجاح");
             navigate(`/auctions/${auctionId}`);
        } catch (e: any) {
            alert(e.message || "فشل التحديث");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;
    if (error) return <div className="p-10 text-center text-red-600">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header />
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">تعديل المزاد</h1>
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">إلغاء</button>
                </div>

                <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">عنوان المزاد</label>
                        <input 
                            type="text" 
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
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
                            className="w-full p-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        />
                     </div>

                     <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">السعر الابتدائي</label>
                            <input 
                                type="number" 
                                name="startingPrice"
                                value={formData.startingPrice}
                                onChange={handleChange}
                                className="w-full p-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">الحد الأدنى للزيادة</label>
                            <input 
                                type="number" 
                                name="minIncrement"
                                value={formData.minIncrement}
                                onChange={handleChange}
                                className="w-full p-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                            />
                        </div>
                     </div>

                     <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">وقت البداية</label>
                            <input 
                                type="datetime-local" 
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleChange}
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
                                className="w-full p-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                            />
                        </div>
                     </div>

                     <div className="pt-6">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] ${saving ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
                        >
                            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                        </button>
                     </div>
                </form>
            </div>
        </div>
    );
}

