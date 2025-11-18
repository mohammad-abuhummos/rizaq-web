import { useAuthGate } from "@/hooks/useAuthGate";
import {
  getAuctionById,
  listAuctionsCreatedByUser,
  listBidsByAuction,
} from "@/services/auction";
import { getCropById } from "@/services/crop";
import { getAuthUser } from "@/storage/auth-storage";
import type { AuctionDetail } from "@/types/auction";
import type { CropDetail } from "@/types/crop";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Fallback random images for auctions if no real images are available
const AUCTION_IMAGES = [
  "https://images.pexels.com/photos/1300975/pexels-photo-1300975.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1268101/pexels-photo-1268101.jpeg?auto=compress&cs=tinysrgb&w=800",
];

const getRandomImage = (id: number) =>
  AUCTION_IMAGES[id % AUCTION_IMAGES.length];

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
      className={`rounded-xl p-4 ${isExpired ? "bg-gray-400" : "bg-red-600"}`}
    >
      <Text className="mb-2 text-base text-center text-white font-cairo-bold">
        {isExpired ? "انتهى المزاد" : "الوقت المتبقي"}
      </Text>
      {!isExpired && (
        <View className="flex-row gap-2 justify-center items-center">
          <View className="items-center bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
            <Text className="text-2xl text-white font-cairo-bold">
              {String(timeLeft.seconds).padStart(2, "0")}
            </Text>
            <Text className="text-xs text-white font-cairo">ثانية</Text>
          </View>
          <Text className="text-2xl text-white font-cairo-bold">:</Text>
          <View className="items-center bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
            <Text className="text-2xl text-white font-cairo-bold">
              {String(timeLeft.minutes).padStart(2, "0")}
            </Text>
            <Text className="text-xs text-white font-cairo">دقيقة</Text>
          </View>
          <Text className="text-2xl text-white font-cairo-bold">:</Text>
          <View className="items-center bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
            <Text className="text-2xl text-white font-cairo-bold">
              {String(timeLeft.hours).padStart(2, "0")}
            </Text>
            <Text className="text-xs text-white font-cairo">ساعة</Text>
          </View>
          <Text className="text-2xl text-white font-cairo-bold">:</Text>
          <View className="items-center bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
            <Text className="text-2xl text-white font-cairo-bold">
              {String(timeLeft.days).padStart(2, "0")}
            </Text>
            <Text className="text-xs text-white font-cairo">يوم</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default function AuctionDetailScreen() {
  const { withAuth } = useAuthGate();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [crop, setCrop] = useState<CropDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuctionDetails = async () => {
      if (!id) {
        setError("معرف المزاد غير صحيح");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getAuctionById(Number(id));
        setAuction(response.data);

        // Fetch crop details if cropId is available
        if (response.data.cropId) {
          try {
            const cropResponse = await getCropById(response.data.cropId);
            setCrop(cropResponse.data);
          } catch (cropErr) {
            console.error("Error fetching crop details:", cropErr);
            // Don't set error, just log it - crop details are optional
          }
        }
        // Determine ownership (prevent joining own auction)
        try {
          const auth = await getAuthUser<{ userId?: number }>();
          const uid = auth?.userId;
          if (uid) {
            const ownerId = (response.data as any)?.createdByUserId;
            if (ownerId) {
              setIsOwner(String(ownerId) === String(uid));
            } else {
              // Fallback: check membership in created-by-me list
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

    fetchAuctionDetails();
  }, [id]);

  const handleJoinAuction = withAuth(() => {
    if (!auction) return;

    if (auction.status !== "open") {
      Alert.alert("تنبيه", "المزاد غير متاح حالياً");
      return;
    }

    // Navigate to the auction join screen
    router.push({
      pathname: `/auctions/join/${auction.auctionId}`,
      params: { ownerMode: isOwner ? "true" : "false" }, 
    });
  });

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
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
          <Text className="flex-1 mr-10 text-xl text-center text-gray-900 font-cairo-bold">
            تفاصيل المزاد
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
        {/* Custom Header */}
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
          <Pressable
            onPress={() => router.back()}
            className="justify-center items-center w-10 h-10 bg-gray-100 rounded-lg active:bg-gray-200"
          >
            <Ionicons name="arrow-forward" size={24} color="#1F2937" />
          </Pressable>
          <Text className="flex-1 mr-10 text-xl text-center text-gray-900 font-cairo-bold">
            تفاصيل المزاد
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

  // Resolve the primary image URL for this auction without adding extra hooks
  const resolvePrimaryImageUrl = () => {
    const anyAuction = auction as any;

    // 1) Prefer explicit images array from auction detail (what the API returns)
    if (anyAuction?.images && Array.isArray(anyAuction.images)) {
      if (anyAuction.images.length > 0) return anyAuction.images[0] as string;
    }

    // 2) Fallback to optional imageUrls field (if backend ever exposes it)
    if (anyAuction?.imageUrls && Array.isArray(anyAuction.imageUrls)) {
      if (anyAuction.imageUrls.length > 0)
        return anyAuction.imageUrls[0] as string;
    }

    // 3) Fallback to crop images (if API returns them)
    if (crop && (crop as any)?.images && Array.isArray((crop as any).images)) {
      const imgs = (crop as any).images as string[];
      if (imgs.length > 0) return imgs[0];
    }

    // 4) Final fallback: a random stock image
    return getRandomImage(auction.auctionId);
  };

  const primaryImageUrl = resolvePrimaryImageUrl();
  const isAuctionOpen = auction.status === "open";

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
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
          {auction.auctionTitle || "تفاصيل المزاد"}
        </Text>
      </View>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View className="relative">
          <Image
            source={{ uri: primaryImageUrl }}
            className="w-full h-72"
            resizeMode="cover"
          />
          {/* Status Badge */}
          <View
            className={`absolute top-4 right-4 rounded-full px-4 py-2 ${isAuctionOpen ? "bg-green-600" : "bg-gray-600"}`}
          >
            <Text className="text-sm text-white font-cairo-bold">
              {isAuctionOpen
                ? "مفتوح"
                : auction.status === "closed"
                  ? "مغلق"
                  : "قريباً"}
            </Text>
          </View>
          {/* Location Badge */}
          <View className="absolute top-4 left-4 flex-row gap-1 items-center px-3 py-2 rounded-full bg-white/90">
            <Ionicons name="location" size={16} color="#059669" />
            <Text className="text-xs text-emerald-600 font-cairo-semibold">
              محافظة دمشق
            </Text>
          </View>
        </View>

        {/* Content Section */}
        <View className="p-5">
          {/* Title */}
          <Text className="mb-2 text-2xl text-gray-900 font-cairo-bold">
            {auction.auctionTitle}
          </Text>

          {/* Description */}
          {auction.auctionDescription && (
            <Text className="mb-4 text-base leading-6 text-gray-600 font-cairo">
              {auction.auctionDescription}
            </Text>
          )}

          {/* Countdown Timer */}
          <View className="mb-6">
            <CountdownTimer endTime={auction.endTime} />
          </View>

          {/* Price Section */}
          <View className="p-4 mb-4 bg-emerald-50 rounded-xl">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base text-gray-700 font-cairo-semibold">
                السعر الابتدائي
              </Text>
              <Text className="text-xl text-emerald-700 font-cairo-bold">
                {auction.startingPrice.toLocaleString()} ل.س
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-base text-gray-700 font-cairo-semibold">
                السعر الحالي
              </Text>
              <Text className="text-2xl text-emerald-700 font-cairo-bold">
                {auction.currentPrice.toLocaleString()} ل.س
              </Text>
            </View>
          </View>

          {/* Details Grid */}
          <View className="p-4 mb-4 bg-gray-50 rounded-xl">
            <Text className="mb-3 text-lg text-gray-800 font-cairo-bold">
              تفاصيل المزاد
            </Text>

            <View className="gap-3">
              <View className="flex-row justify-between items-center">
                <View className="flex-row gap-2 items-center">
                  <Ionicons name="trending-up" size={20} color="#059669" />
                  <Text className="text-sm text-gray-600 font-cairo">
                    الحد الأدنى للزيادة
                  </Text>
                </View>
                <Text className="text-sm text-gray-800 font-cairo-bold">
                  {auction.minIncrement.toLocaleString()} ل.س
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <View className="flex-row gap-2 items-center">
                  <Ionicons name="calendar-outline" size={20} color="#059669" />
                  <Text className="text-sm text-gray-600 font-cairo">
                    تاريخ البدء
                  </Text>
                </View>
                <Text className="text-sm text-gray-800 font-cairo-bold">
                  {new Date(auction.startTime).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <View className="flex-row gap-2 items-center">
                  <Ionicons name="calendar-outline" size={20} color="#059669" />
                  <Text className="text-sm text-gray-600 font-cairo">
                    تاريخ الانتهاء
                  </Text>
                </View>
                <Text className="text-sm text-gray-800 font-cairo-bold">
                  {new Date(auction.endTime).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <View className="flex-row gap-2 items-center">
                  <Ionicons name="time-outline" size={20} color="#059669" />
                  <Text className="text-sm text-gray-600 font-cairo">
                    وقت الانتهاء
                  </Text>
                </View>
                <Text className="text-sm text-gray-800 font-cairo-bold">
                  {new Date(auction.endTime).toLocaleTimeString("ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <View className="flex-row gap-2 items-center">
                  <Ionicons name="cube-outline" size={20} color="#059669" />
                  <Text className="text-sm text-gray-600 font-cairo">
                    رقم المحصول
                  </Text>
                </View>
                <Text className="text-sm text-gray-800 font-cairo-bold">
                  #{auction.cropId}
                </Text>
              </View>
            </View>
          </View>

          {/* Crop Details Section */}
          {crop && (
            <View className="p-4 mb-4 bg-green-50 rounded-xl border border-emerald-100">
              <Text className="mb-3 text-lg text-gray-800 font-cairo-bold">
                معلومات المحصول
              </Text>

              <View className="gap-3">
                {crop.name && (
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row gap-2 items-center">
                      <Ionicons name="leaf" size={20} color="#059669" />
                      <Text className="text-sm text-gray-600 font-cairo">
                        اسم المحصول
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-800 font-cairo-bold">
                      {crop.name}
                    </Text>
                  </View>
                )}

                {crop.quantity > 0 && (
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row gap-2 items-center">
                      <Ionicons name="analytics" size={20} color="#059669" />
                      <Text className="text-sm text-gray-600 font-cairo">
                        الكمية
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-800 font-cairo-bold">
                      {crop.quantity.toLocaleString()} {crop.unit}
                    </Text>
                  </View>
                )}

                {crop.qualityGrade && (
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row gap-2 items-center">
                      <Ionicons name="star" size={20} color="#059669" />
                      <Text className="text-sm text-gray-600 font-cairo">
                        درجة الجودة
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-800 font-cairo-bold">
                      {crop.qualityGrade}
                    </Text>
                  </View>
                )}

                {crop.supplyScope && (
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row gap-2 items-center">
                      <Ionicons
                        name="globe-outline"
                        size={20}
                        color="#059669"
                      />
                      <Text className="text-sm text-gray-600 font-cairo">
                        نطاق التوريد
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-800 font-cairo-bold">
                      {crop.supplyScope}
                    </Text>
                  </View>
                )}

                {crop.harvestDate && (
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row gap-2 items-center">
                      <Ionicons name="calendar" size={20} color="#059669" />
                      <Text className="text-sm text-gray-600 font-cairo">
                        تاريخ الحصاد
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-800 font-cairo-bold">
                      {new Date(crop.harvestDate).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                )}

                {crop.variety && (
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row gap-2 items-center">
                      <Ionicons
                        name="flower-outline"
                        size={20}
                        color="#059669"
                      />
                      <Text className="text-sm text-gray-600 font-cairo">
                        الصنف
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-800 font-cairo-bold">
                      {crop.variety}
                    </Text>
                  </View>
                )}

                {crop.color && (
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row gap-2 items-center">
                      <Ionicons
                        name="color-palette-outline"
                        size={20}
                        color="#059669"
                      />
                      <Text className="text-sm text-gray-600 font-cairo">
                        اللون
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-800 font-cairo-bold">
                      {crop.color}
                    </Text>
                  </View>
                )}

                {crop.size && (
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row gap-2 items-center">
                      <Ionicons
                        name="resize-outline"
                        size={20}
                        color="#059669"
                      />
                      <Text className="text-sm text-gray-600 font-cairo">
                        الحجم
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-800 font-cairo-bold">
                      {crop.size}
                    </Text>
                  </View>
                )}

                {crop.packingMethod && (
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row gap-2 items-center">
                      <Ionicons name="cube" size={20} color="#059669" />
                      <Text className="text-sm text-gray-600 font-cairo">
                        طريقة التعبئة
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-800 font-cairo-bold">
                      {crop.packingMethod}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Join Auction Button */}
          <Pressable
            onPress={handleJoinAuction}
            disabled={!isAuctionOpen}
            className={`rounded-xl py-4 mt-2 mb-8 active:opacity-80 ${!isAuctionOpen ? "bg-gray-400" : "bg-emerald-700"}`}
          >
            <View className="flex-row gap-2 justify-center items-center">
              <Ionicons name="hammer" size={24} color="white" />
              <Text className="text-lg text-white font-cairo-bold">
                {!isAuctionOpen
                  ? "المزاد غير متاح"
                  : isOwner
                    ? "لا يمكنك الانضمام لمزادك"
                    : "الانضمام للمزاد"}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
