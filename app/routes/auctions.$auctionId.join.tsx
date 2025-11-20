import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router';
import { Header } from '~/components/Header';
import { getAuctionById, listBidsByAuctionId } from '~/lib/services/auction';
import { getCropById } from '~/lib/services/crop';
import { getAuthUser } from '~/lib/storage/auth-storage';
import { CountdownTimer } from '~/components/CountdownTimer';
import type { AuctionDetail } from '~/lib/types/auction';
import type { CropDetail } from '~/lib/types/crop';
import { HubConnectionBuilder, LogLevel, type HubConnection } from "@microsoft/signalr";

export default function AuctionJoin() {
    const { auctionId } = useParams<{ auctionId: string }>();
    const [searchParams] = useSearchParams();
    const ownerMode = searchParams.get('ownerMode') === 'true';
    const navigate = useNavigate();
    
    const connectionRef = useRef<HubConnection | null>(null);
    const [auction, setAuction] = useState<AuctionDetail | null>(null);
    const [crop, setCrop] = useState<CropDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bids, setBids] = useState<any[]>([]);
    
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [minIncrement, setMinIncrement] = useState<number>(0);
    const [auctionStatus, setAuctionStatus] = useState<string>('');
    
    const [connected, setConnected] = useState(false);
    const [joined, setJoined] = useState(false);
    const [bidIncrement, setBidIncrement] = useState<string>('');
    const [submittingBid, setSubmittingBid] = useState(false);
    
    // User ID from local storage
    const [userId, setUserId] = useState<number | null>(null);

    // Initialize User
    useEffect(() => {
        getAuthUser().then((auth: any) => {
            if (auth?.userId || auth?.id) {
                setUserId(Number(auth.userId || auth.id));
            }
        });
    }, []);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if (!auctionId) return;
            setLoading(true);
            try {
                const response = await getAuctionById(Number(auctionId));
                setAuction(response.data);
                setCurrentPrice(response.data.currentPrice);
                setMinIncrement(response.data.minIncrement);
                setAuctionStatus(response.data.status);
                setBidIncrement(String(response.data.minIncrement));

                if (response.data.cropId) {
                    try {
                        const cropRes = await getCropById(response.data.cropId);
                        setCrop(cropRes.data);
                    } catch {}
                }

                // Load initial bids
                try {
                    const bidsRes = await listBidsByAuctionId(Number(auctionId));
                    const apiData = (bidsRes as any)?.data?.data ?? (bidsRes as any)?.data ?? [];
                    if (Array.isArray(apiData)) {
                        setBids(apiData.map((b: any) => ({
                             price: b.bidAmount || b.price || 0,
                             userId: b.bidderUserId || b.userId,
                             time: new Date(b.createdAt).toLocaleTimeString('ar-EG'),
                        })).reverse()); // Assuming API returns oldest first? Or just sort
                    }
                } catch {}

            } catch (e: any) {
                setError(e.message || "فشل في تحميل البيانات");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [auctionId]);

    // SignalR Connection
    const startConnection = useCallback(async () => {
        if (connectionRef.current || !auction || !userId) return;

        // Use configured base URL or default
        const baseUrl = import.meta.env.VITE_API_URL || 'https://alhal.awnak.net'; 
        
        const conn = new HubConnectionBuilder()
            .withUrl(`${baseUrl}/hubs/auctions`)
            .configureLogging(LogLevel.Information)
            .withAutomaticReconnect()
            .build();

        conn.on("BidPlaced", (payload: any) => {
            console.log("BidPlaced", payload);
            if (payload.auctionId !== auction.auctionId) return;
            
            setCurrentPrice(payload.currentPrice);
            setMinIncrement(payload.minIncrement);
            
            setBids(prev => [{
                price: payload.currentPrice,
                userId: payload.userId,
                time: new Date().toLocaleTimeString('ar-EG'),
            }, ...prev]);
        });

        conn.on("PriceTick", (payload: any) => {
            if (payload.currentPrice) setCurrentPrice(payload.currentPrice);
            if (payload.minIncrement) setMinIncrement(payload.minIncrement);
            if (payload.status) setAuctionStatus(payload.status);
        });

        try {
            await conn.start();
            connectionRef.current = conn;
            setConnected(true);
            
            await conn.invoke("JoinAuction", auction.auctionId, userId, null);
            setJoined(true);
        } catch (e) {
            console.error("SignalR Connection Error", e);
        }
    }, [auction, userId]);

    useEffect(() => {
        if (auction && userId && !ownerMode) {
            startConnection();
        }
        return () => {
            if (connectionRef.current) {
                connectionRef.current.stop();
                connectionRef.current = null;
            }
        };
    }, [auction, userId, ownerMode, startConnection]);


    const handlePlaceBid = async () => {
        if (!auction || !userId || !connectionRef.current) return;
        
        const inc = parseFloat(bidIncrement);
        if (isNaN(inc) || inc < minIncrement) {
            alert(`الحد الأدنى للزيادة هو ${minIncrement}`);
            return;
        }

        setSubmittingBid(true);
        try {
            await connectionRef.current.invoke("PlaceBid", {
                AuctionId: auction.auctionId,
                BidderUserId: userId,
                bidAmount: currentPrice + inc
            });
            setBidIncrement(String(minIncrement)); // reset to min
        } catch (e: any) {
            alert("فشل تقديم العرض: " + e.message);
        } finally {
            setSubmittingBid(false);
        }
    };

    const isAuctionOpen = auctionStatus === "open";
    const canBid = connected && joined && isAuctionOpen && !submittingBid && !ownerMode;

    if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;
    if (error || !auction) return <div className="p-10 text-center text-red-600">{error || "خطأ"}</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header />
            <div className="max-w-5xl mx-auto px-4 py-8">
                 {/* Connection Status */}
                <div className={`mb-6 px-4 py-2 rounded-lg flex items-center gap-2 ${connected ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    <div className={`w-3 h-3 rounded-full ${connected ? "bg-green-600" : "bg-yellow-600 animate-pulse"}`}></div>
                    <span className="text-sm font-bold">{connected ? "متصل بالخادم" : "جاري الاتصال..."}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Left Column: Auction Info & Bidding */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{auction.auctionTitle}</h2>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="animate-pulse w-2 h-2 bg-red-600 rounded-full"></span>
                                <span className="text-red-600 font-bold text-sm">بث مباشر</span>
                            </div>

                            <div className="mb-6">
                                <CountdownTimer endTime={auction.endTime} />
                            </div>

                             {/* Price Display */}
                            <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-200 mb-8">
                                <p className="text-gray-500 font-semibold mb-2">السعر الحالي</p>
                                <p className="text-5xl font-bold text-emerald-600 mb-1">{currentPrice.toLocaleString()}</p>
                                <p className="text-sm text-gray-400">ليرة سورية</p>
                            </div>

                            {/* Bidding Controls */}
                            {!ownerMode && isAuctionOpen ? (
                                <div className="space-y-4">
                                    <div className="flex gap-2 flex-wrap justify-center">
                                        {[minIncrement, minIncrement * 2, minIncrement * 5, minIncrement * 10].map(amt => (
                                            <button 
                                                key={amt}
                                                onClick={() => setBidIncrement(String(amt))}
                                                className={`px-4 py-2 rounded-lg border text-sm font-bold transition-colors ${
                                                    Number(bidIncrement) === amt 
                                                    ? "bg-green-600 text-white border-green-600" 
                                                    : "bg-white text-gray-600 border-gray-300 hover:border-green-500"
                                                }`}
                                            >
                                                +{amt.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="flex-1 relative">
                                            <input 
                                                type="number" 
                                                value={bidIncrement}
                                                onChange={(e) => setBidIncrement(e.target.value)}
                                                className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-left pl-12 font-bold text-lg"
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">ل.س</span>
                                        </div>
                                        <button 
                                            onClick={handlePlaceBid}
                                            disabled={!canBid}
                                            className={`px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${canBid ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-400 cursor-not-allowed"}`}
                                        >
                                            {submittingBid ? "جاري..." : "زايد الآن"}
                                        </button>
                                    </div>
                                    <p className="text-center text-gray-500 text-sm">
                                        عرضك القادم سيكون: <span className="font-bold text-emerald-700">{(currentPrice + (Number(bidIncrement) || 0)).toLocaleString()} ل.س</span>
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-100 text-center rounded-xl text-gray-600 font-bold">
                                    {ownerMode ? "أنت تشاهد هذا المزاد بصفتك المالك" : "المزاد مغلق"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Bid History */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 h-full max-h-[600px] flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-4">سجل المزايدات</h3>
                            
                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                {bids.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400">لا توجد مزايدات حتى الآن</div>
                                ) : (
                                    bids.map((bid, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-green-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                                                    {bids.length - idx}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">
                                                        {Number(bid.userId) === Number(userId) ? "أنت" : `مستخدم #${bid.userId}`}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{bid.time}</p>
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-emerald-600 text-lg">{bid.price.toLocaleString()}</p>
                                                <p className="text-xs text-gray-400">ل.س</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

