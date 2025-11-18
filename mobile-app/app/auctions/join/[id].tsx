import { useAuthGate } from "@/hooks/useAuthGate";
import {
  getAuctionById,
  listAuctionsCreatedByUser,
  listBidsByAuctionId,
} from "@/services/auction";
import { getCropById } from "@/services/crop";
import { getAuthToken } from "@/storage/auth-storage";
import type { AuctionDetail } from "@/types/auction";
import type { CropDetail } from "@/types/crop";
import { getApiBaseUrl } from "@/utils/config";
import { Ionicons } from "@expo/vector-icons";
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PriceTickPayload = {
  auctionId?: number;
  currentPrice?: number;
  status?: string;
  timestamp?: string;
  [key: string]: any;
};

interface CountdownTimerProps {
  endTime: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endTime).getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const isExpired =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  return (
    <View
      className={`rounded-xl p-3 ${isExpired ? "bg-gray-400" : "bg-red-600"}`}
    >
      <Text className="mb-2 text-sm text-center text-white font-cairo-bold">
        {isExpired ? "انتهى المزاد" : "الوقت المتبقي"}
      </Text>
      {!isExpired && (
        <View className="flex-row gap-1 justify-center items-center">
          <View className="items-center bg-white/20 rounded-lg px-2 py-1.5 min-w-[50px]">
            <Text className="text-xl text-white font-cairo-bold">
              {String(timeLeft.seconds).padStart(2, "0")}
            </Text>
            <Text className="text-[10px] text-white font-cairo">ثانية</Text>
          </View>
          <Text className="text-lg text-white font-cairo-bold">:</Text>
          <View className="items-center bg-white/20 rounded-lg px-2 py-1.5 min-w-[50px]">
            <Text className="text-xl text-white font-cairo-bold">
              {String(timeLeft.minutes).padStart(2, "0")}
            </Text>
            <Text className="text-[10px] text-white font-cairo">دقيقة</Text>
          </View>
          <Text className="text-lg text-white font-cairo-bold">:</Text>
          <View className="items-center bg-white/20 rounded-lg px-2 py-1.5 min-w-[50px]">
            <Text className="text-xl text-white font-cairo-bold">
              {String(timeLeft.hours).padStart(2, "0")}
            </Text>
            <Text className="text-[10px] text-white font-cairo">ساعة</Text>
          </View>
          <Text className="text-lg text-white font-cairo-bold">:</Text>
          <View className="items-center bg-white/20 rounded-lg px-2 py-1.5 min-w-[50px]">
            <Text className="text-xl text-white font-cairo-bold">
              {String(timeLeft.days).padStart(2, "0")}
            </Text>
            <Text className="text-[10px] text-white font-cairo">يوم</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default function AuctionJoinScreen() {
  useAuthGate(); // Ensure user is authenticated
  const { id, ownerMode } = useLocalSearchParams<{
    id: string;
    ownerMode?: string;
  }>();
  const lastBidRef = useRef<{
    price?: number;
    userId?: number;
    auctionId?: number;
  } | null>(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const ImTheOwner = ownerMode === "true";

  // Data states
  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [crop, setCrop] = useState<CropDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minIncrement, setMinIncrement] = useState<number | undefined>(
    undefined
  );
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

  const [bids, setBids] = useState<
    {
      price: number;
      minIncrement?: number;
      status?: string;
      time: string;
      userId?: number;
    }[]
  >([]);

  // WebSocket states
  const [connected, setConnected] = useState<boolean>(false);
  const [joined, setJoined] = useState<boolean>(false);
  const [currentPrice, setCurrentPrice] = useState<number | undefined>(
    undefined
  );
  const [auctionStatus, setAuctionStatus] = useState<string | undefined>(
    undefined
  );

  // Bidding states
  const [bidIncrement, setBidIncrement] = useState<string>("");
  const [submittingBid, setSubmittingBid] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const [isOwner, setIsOwner] = useState<boolean>(false);

  const baseUrl = getApiBaseUrl();
  const hubUrl = useMemo(() => `${baseUrl}/hubs/auctions`, [baseUrl]);

  // Fetch auction and crop data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("معرف المزاد غير صحيح");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get user ID from token
        const token = await getAuthToken();
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setUserId(
              parseInt(payload.sub || payload.userId || payload.id, 10)
            );
          } catch (e) {
            console.error("Error decoding token:", e);
          }
        }

        const response = await getAuctionById(Number(id));
        setAuction(response.data);

        // تحميل المزايدات
        try {
          const bidsResponse = await listBidsByAuctionId(Number(id));
          const apiData = bidsResponse?.data?.data ?? bidsResponse?.data ?? [];
          console.log("📥 Loaded bids:", apiData.length);

          if (Array.isArray(apiData)) {
            const formatted = apiData.map((b: any) => ({
              price: b.bidAmount || b.price || 0,
              minIncrement: b.minIncrement || response.data.minIncrement,
              status: b.status || response.data.status,
              time: new Date(b.createdAt).toLocaleTimeString("ar-EG", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              userId: b.bidderUserId || b.userId,
            }));
            setBids(formatted);
          }
        } catch (err) {
          console.warn("⚠️ Failed to fetch bids:", err);
          setBids([]);
        }

        setCurrentPrice(response.data.currentPrice);
        setAuctionStatus(response.data.status);
        setBidIncrement(response.data.minIncrement.toString());
        setMaxPrice(response.data.maxPrice.toString());

        if (response.data.cropId) {
          try {
            const cropResponse = await getCropById(response.data.cropId);
            setCrop(cropResponse.data);
          } catch (cropErr) {
            console.error("Error fetching crop details:", cropErr);
          }
        }

        // Check ownership
        try {
          const uid = userId;
          if (uid) {
            const ownerId = (response.data as any)?.createdByUserId;
            if (ownerId) {
              setIsOwner(String(ownerId) === String(uid));
            } else {
              const mine = await listAuctionsCreatedByUser(uid).catch(
                () => ({ data: [] }) as any
              );
              const myList = (mine as any)?.data ?? mine;
              const found =
                Array.isArray(myList) &&
                myList.some((a: any) => String(a?.auctionId) === String(id));
              setIsOwner(Boolean(found));
            }
          }
        } catch {}
      } catch (err) {
        console.error("Error fetching auction details:", err);
        setError("فشل في تحميل تفاصيل المزاد");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // WebSocket connection
  const startConnection = useCallback(async () => {
    if (connectionRef.current || !auction || !userId) return;

    const conn = new HubConnectionBuilder()
      .withUrl(hubUrl)
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .build();

    conn.serverTimeoutInMilliseconds = 60000;
    conn.keepAliveIntervalInMilliseconds = 15000;

    conn.off("PriceTick");
    conn.off("BidPlaced");
    conn.off("AuctionUpdated");
    conn.off("ReceiveReminder");
    conn.off("receivereminder");
    conn.off("Error");

    const handleBidPlaced = (payload: any) => {
      if (!payload || typeof payload.currentPrice !== "number") return;

      console.log(" BidPlaced event:", payload);

      if (
        lastBidRef.current &&
        lastBidRef.current.price === payload.currentPrice &&
        lastBidRef.current.userId === payload.userId &&
        lastBidRef.current.auctionId === payload.auctionId &&
        Math.abs(
          new Date().getTime() -
            new Date(lastBidRef.current?.time || 0).getTime()
        ) < 2000
      ) {
        return;
      }

      lastBidRef.current = {
        auctionId: payload.auctionId,
        price: payload.currentPrice,
        userId: payload.userId,
        time: new Date().toISOString(),
      };

      setCurrentPrice(payload.currentPrice);
      setMinIncrement(payload.minIncrement);
      setBids((prev) => [
        {
          price: payload.currentPrice,
          minIncrement: payload.minIncrement,
          status: payload.status,
          time: new Date().toLocaleTimeString(),
          userId: payload.userId,
        },
        ...prev,
      ]);

      if (payload.userId === userId) {
        console.log("🟢 أنت قمت بالمزايدة على السعر:", payload.currentPrice);
      } else {
        console.log(
          `🟡 مستخدم آخر (${payload.userId}) قام بالمزايدة على ${payload.currentPrice}`
        );
      }
    };

    const handlePriceTick = (payload: any) => {
      if (!payload || typeof payload.currentPrice !== "number") return;
      console.log(" PriceTick event:", payload);

      setCurrentPrice(payload.currentPrice);
      setMinIncrement(payload.minIncrement);

      if (typeof payload.status === "string") setAuctionStatus(payload.status);
    };

    conn.on("BidPlaced", handleBidPlaced);
    conn.on("PriceTick", handlePriceTick);

    conn.on("AuctionUpdated", (payload: any) =>
      console.log(" Auction updated:")
    );

    conn.on("ReceiveReminder", (p: any) => console.log(" ReceiveReminder:", p));
    conn.on("receivereminder", (p: any) => console.log("receivereminder:", p));

    conn.on("Error", (err: any) => {
      console.error(" WebSocket error:", err);
      Alert.alert("خطأ", err?.message || "حدث خطأ في الاتصال");
    });

    conn.onclose(() => {
      setConnected(false);
      setJoined(false);
      connectionRef.current = null;
    });

    conn.onreconnected(() => {
      setConnected(true);
      if (auction) {
        conn
          .invoke("JoinAuction", auction.auctionId, userId, null)
          .catch(console.error);
      }
    });

    try {
      await conn.start();
      connectionRef.current = conn;
      setConnected(true);

      await conn.invoke("JoinAuction", auction.auctionId, userId, null);
      setJoined(true);

      await conn.invoke("GetCurrentPrice", auction.auctionId);
    } catch (error: any) {
      console.error("Connection error:", error);
      Alert.alert(
        "خطأ في الاتصال",
        "فشل الاتصال بخادم المزاد. جارٍ إعادة المحاولة..."
      );
      setTimeout(() => {
        connectionRef.current = null;
        startConnection();
      }, 3000);
    }
  }, [auction, userId, hubUrl]);

  useEffect(() => {
    if (auction && userId && !isOwner) {
      startConnection();
    }

    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        const c = connectionRef.current;
        connectionRef.current = null;
        if (c) c.stop().catch(() => {});
      } else if (auction && userId) {
        startConnection();
      }
    });

    return () => {
      const conn = connectionRef.current;
      connectionRef.current = null;
      if (conn) {
        conn.stop().catch(console.error);
      }
      try {
        sub.remove();
      } catch {}
    };
  }, [auction, userId, isOwner, startConnection]);

  // Redirect owners back to details page
  useEffect(() => {
    if (isOwner && id) {
      Alert.alert("غير مسموح", "لا يمكنك الانضمام أو المزايدة على مزادك الخاص");
      try {
        router.replace(`/auctions/${id}` as any);
      } catch {}
    }
  }, [isOwner, id]);

  const handlePlaceBid = async () => {
    if (!auction || !userId || !connectionRef.current || !currentPrice) return;
    console.log("first", auction.maxPrice);
    const increment = parseFloat(bidIncrement);

    if (isNaN(increment) || increment < auction.minIncrement) {
      Alert.alert(
        "خطأ",
        `الحد الأدنى للزيادة هو ${auction.minIncrement.toLocaleString()} ل.س`
      );
      return;
    }

    if (isNaN(increment) || increment > auction?.maxPrice) {
      Alert.alert(
        "خطأ",
        `الحد الأعلى  للزيادة هو ${auction?.maxPrice.toLocaleString()} ل.س`
      );
      return;
    }

    const finalBidAmount = currentPrice + increment;

    try {
      setSubmittingBid(true);
      await connectionRef.current.invoke("PlaceBid", {
        AuctionId: auction.auctionId,
        BidderUserId: userId,
        bidAmount: finalBidAmount,
      });

      Alert.alert("نجح", "تم تقديم عرضك بنجاح");
      // Reset to minimum increment after successful bid
      await refreshBids();

      setBidIncrement(auction.minIncrement.toString());
    } catch (error: any) {
      console.error("Bid error:", error);
      Alert.alert(
        "فشل تقديم العرض",
        error?.message || "حدث خطأ أثناء تقديم عرضك"
      );
    } finally {
      setSubmittingBid(false);
    }
  };

  const quickBidIncrement = (amount: number) => {
    setBidIncrement(amount.toString());
  };

  const refreshBids = useCallback(async () => {
    if (!id) return;
    try {
      const bidsResponse = await listBidsByAuctionId(Number(id));
      const apiData = bidsResponse?.data?.data ?? bidsResponse?.data ?? [];
      console.log("🔄 Refresh bids:", apiData.length);

      if (Array.isArray(apiData)) {
        const formatted = apiData.map((b: any) => ({
          price: b.bidAmount || b.price || 0,
          minIncrement: b.minIncrement || auction?.minIncrement,
          status: b.status || auction?.status,
          time: new Date(b.createdAt).toLocaleTimeString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          userId: b.bidderUserId || b.userId,
        }));
        setBids(formatted);
      }
    } catch (err) {
      console.warn("⚠️ Failed to refresh bids:", err);
    }
  }, [id, auction]);

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
          <Pressable
            onPress={() => router.back()}
            className="justify-center items-center w-10 h-10 bg-gray-100 rounded-lg active:bg-gray-200"
          >
            <Ionicons name="arrow-forward" size={24} color="#1F2937" />
          </Pressable>
          <Text className="flex-1 mr-10 text-xl text-center text-gray-900 font-cairo-bold">
            المزاد المباشر
          </Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#059669" />
          <Text className="mt-4 text-gray-500 font-cairo">جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !auction) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
          <Pressable
            onPress={() => router.back()}
            className="justify-center items-center w-10 h-10 bg-gray-100 rounded-lg active:bg-gray-200"
          >
            <Ionicons name="arrow-forward" size={24} color="#1F2937" />
          </Pressable>
          <Text className="flex-1 mr-10 text-xl text-center text-gray-900 font-cairo-bold">
            المزاد المباشر
          </Text>
        </View>
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="mt-4 text-xl text-center text-gray-800 font-cairo-bold">
            {error || "حدث خطأ"}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="px-6 py-3 mt-6 bg-emerald-700 rounded-lg active:bg-emerald-800"
          >
            <Text className="text-white font-cairo-bold">العودة</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isAuctionOpen = auctionStatus === "open";
  const displayPrice = currentPrice || auction.currentPrice;
  const computedBid = displayPrice + (parseFloat(bidIncrement) || 0);
  const canBid =
    connected && joined && isAuctionOpen && !submittingBid && !isOwner;

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "left", "right"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          className="justify-center items-center w-10 h-10 bg-gray-100 rounded-lg active:bg-gray-200"
        >
          <Ionicons name="arrow-forward" size={24} color="#1F2937" />
        </Pressable>
        <Text
          className="flex-1 mr-10 text-xl text-center text-gray-900 font-cairo-bold"
          numberOfLines={1}
        >
          {auction.auctionTitle || "المزاد المباشر"}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Connection Status */}
          <View
            className={`px-4 py-2 ${connected ? "bg-emerald-50" : "bg-yellow-50"}`}
          >
            <View className="flex-row gap-2 justify-center items-center">
              <View
                className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-600" : "bg-yellow-600"}`}
              />
              <Text
                className={`text-sm font-cairo-semibold ${connected ? "text-emerald-700" : "text-yellow-700"}`}
              >
                {connected ? "متصل" : "جارٍ الاتصال..."}
              </Text>
            </View>
          </View>

          <View className="p-4">
            {/* Countdown Timer */}
            <CountdownTimer endTime={auction.endTime} />

            {/* Current Price Card */}
            <View className="p-6 mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Text className="mb-2 text-sm text-center text-gray-600 font-cairo-semibold">
                السعر الحالي
              </Text>
              <Text className="mb-1 text-4xl text-center text-emerald-700 font-cairo-bold">
                {displayPrice.toLocaleString()}
              </Text>
              <Text className="text-base text-center text-gray-500 font-cairo">
                ليرة سورية
              </Text>
            </View>

            {/* Auction Info */}
            <View className="p-4 mt-4 bg-white rounded-xl ">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-gray-600 font-cairo">
                  السعر الابتدائي:
                </Text>
                <Text className="text-sm text-gray-900 font-cairo-bold">
                  {auction.startingPrice.toLocaleString()} ل.س
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-gray-600 font-cairo">
                  الحد الأدنى للزيادة:
                </Text>
                <Text className="text-sm text-emerald-700 font-cairo-bold">
                  {auction.minIncrement.toLocaleString()} ل.س
                </Text>
              </View>
            </View>

            {/* Crop Info (if available) */}
            {crop && (
              <View className="py-4 my-4 mt-4 bg-green-50 rounded-xl border border-emerald-100 px-4">
                <Text className="mb-2 text-base text-gray-800 font-cairo-bold">
                  معلومات المحصول
                </Text>
                <View className="gap-2">
                  {crop.name && (
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-gray-600 font-cairo">
                        الاسم:
                      </Text>
                      <Text className="text-sm text-gray-900 font-cairo-bold">
                        {crop.name}
                      </Text>
                    </View>
                  )}
                  {crop.quantity > 0 && (
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-gray-600 font-cairo">
                        الكمية:
                      </Text>
                      <Text className="text-sm text-gray-900 font-cairo-bold">
                        {crop.quantity.toLocaleString()} {crop.unit}
                      </Text>
                    </View>
                  )}
                  {crop.qualityGrade && (
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-gray-600 font-cairo">
                        الجودة:
                      </Text>
                      <Text className="text-sm text-gray-900 font-cairo-bold">
                        {crop.qualityGrade}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View className="mx-4 mt-6 mb-3">
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse" />
                <Text className="text-red-600 font-bold text-sm">بث مباشر</Text>
                <Text className="text-gray-900 font-bold text-base mr-2">
                  المزاد المباشر
                </Text>
              </View>
            </View>

            {bids.length === 0 ? (
              <Text className="text-gray-500 text-center">
                لا يوجد مزايدات بعد
              </Text>
            ) : (
              <FlatList
                data={bids}
                scrollEnabled={true} // ✅ خلي التمرير عند ScrollView فقط
                nestedScrollEnabled={true}
                keyExtractor={(_, index) => index.toString()}
                style={{ maxHeight: 320 }} // نفس max-h-80 تقريبا
                renderItem={({ item, index }) => (
                  <View className="bg-white rounded-xl border border-amber-200 p-4 shadow-md mb-2">
                    <View className="flex-row items-center justify-between">
                      <View className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl items-center justify-center shadow-sm">
                        <Text className="text-emerald-700 text-base font-bold">
                          {index + 1}
                        </Text>
                      </View>
                      <Text className="text-black text-base font-bold">
                        {item.userId === userId
                          ? "أنت"
                          : `مستخدم #${item.userId}`}
                      </Text>
                      <View className="flex-1 items-center">
                        <Text className="text-gray-500 text-xs">
                          المبلغ السابق
                        </Text>
                        <Text className="text-gray-700 font-bold text-sm mt-1">
                          {index > 0 ? bids[index - 1].price : "—"}
                        </Text>
                      </View>

                      <View className="items-end">
                        <Text className="text-gray-500 text-xs mb-1">
                          المبلغ الجديد
                        </Text>
                        <Text className="text-red-600 font-bold text-lg">
                          {item.price} ل.س
                        </Text>
                        <Text className="text-gray-400 text-xs mt-1">
                          {item.time}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              />
            )}

            {/* Quick Bid Buttons */}
            <View className="mt-4">
              <Text className="mb-2 text-sm text-gray-700 font-cairo-semibold">
                زيادة سريعة:
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {[
                  auction.minIncrement,
                  auction.minIncrement * 2,
                  auction.minIncrement * 5,
                  auction.minIncrement * 10,
                ].map((amount) => (
                  <Pressable
                    key={amount}
                    onPress={() => quickBidIncrement(amount)}
                    className={`px-4 py-2 rounded-lg border ${
                      parseFloat(bidIncrement) === amount
                        ? "bg-emerald-50 border-emerald-600"
                        : "bg-white border-gray-300"
                    } active:opacity-70`}
                  >
                    <Text
                      className={`text-sm font-cairo-bold ${
                        parseFloat(bidIncrement) === amount
                          ? "text-emerald-700"
                          : "text-gray-700"
                      }`}
                    >
                      +{amount.toLocaleString()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Bid Input */}
            <View className="mt-4">
              <Text className="mb-2 text-sm text-gray-700 font-cairo-semibold">
                قيمة الزيادة (ل.س):
              </Text>

              <TextInput
                value={bidIncrement}
                onChangeText={setBidIncrement}
                keyboardType="numeric"
                placeholder={`الحد الأدنى ${auction.minIncrement.toLocaleString()}`}
                className="px-4 py-3 text-lg text-gray-900 bg-white rounded-lg border border-gray-300 font-cairo-bold"
                editable={canBid}
              />
          

              {parseFloat(bidIncrement) > 0 && (
                <Text className="mt-2 text-base text-center text-gray-600 font-cairo">
                  عرضك الجديد:{" "}
                  <Text className="text-emerald-700 font-cairo-bold">
                    {computedBid.toLocaleString()} ل.س
                  </Text>
                </Text>
              )}
            </View>

            {/* Place Bid Button */}
            {ImTheOwner ? (
              <Pressable
                onPress={handlePlaceBid}
                disabled={ImTheOwner}
                className={`mt-6 py-4 rounded-xl active:opacity-80 ${
                  !ImTheOwner ? "bg-emerald-700" : "bg-gray-400"
                }`}
              >
                <View className="flex-row gap-2 justify-center items-center">
                  {submittingBid ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="hammer" size={24} color="white" />
                  )}
                  <Text className="text-lg text-white font-cairo-bold">
                    {ImTheOwner
                      ? "أنت مالك المزاد"
                      : submittingBid
                        ? "جاري تقديم العرض..."
                        : "قدّم عرضك"}
                  </Text>
                </View>
              </Pressable>
            ) : (
              <Pressable
                onPress={handlePlaceBid}
                disabled={!canBid}
                className={`mt-6 py-4 rounded-xl active:opacity-80 ${
                  canBid ? "bg-emerald-700" : "bg-gray-400"
                }`}
              >
                <View className="flex-row gap-2 justify-center items-center">
                  {submittingBid ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="hammer" size={24} color="white" />
                  )}
                  <Text className="text-lg text-white font-cairo-bold">
                    {isOwner
                      ? "أنت مالك المزاد"
                      : submittingBid
                        ? "جاري تقديم العرض..."
                        : "قدّم عرضك"}
                  </Text>
                </View>
              </Pressable>
            )}
    <View className="">
                <Text className="mt-2 text-base text-center text-gray-600 font-cairo">
                  أعلى رقم للزيادة:{" "}
                  <Text className="text-red-700 font-cairo-bold">
                    {maxPrice} ل.س
                  </Text>
                </Text>
              </View>
            {!isAuctionOpen && (
              <View className="p-4 mt-4 bg-red-50 rounded-lg">
                <Text className="text-sm text-center text-red-700 font-cairo-bold">
                  المزاد مغلق حالياً
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
