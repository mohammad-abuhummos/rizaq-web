import { useAuthGate } from "@/hooks/useAuthGate";
import { getOpenAuctions } from "@/services/auction";
import type { OpenAuction } from "@/types/auction";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import type { CategoryFilterState } from "../types";

const AUCTION_IMAGES = [
  "https://images.pexels.com/photos/1300975/pexels-photo-1300975.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/1268101/pexels-photo-1268101.jpeg?auto=compress&cs=tinysrgb&w=400",
];

const getRandomImage = (index: number) =>
  AUCTION_IMAGES[index % AUCTION_IMAGES.length];

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_SPACING = 12;

interface CountdownTimerProps {
  endTime: string;
  statusAuction: string;
  startTime: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  endTime,
  statusAuction,
  startTime,
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [localStatus, setLocalStatus] = useState(statusAuction);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      if (now < start) {
        setLocalStatus("pending");
        const diff = start - now;
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      } else if (now >= start && now < end) {
        setLocalStatus("started");
        const difference = end - now;
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setLocalStatus("closed");
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [startTime, endTime]);

  const bgColor =
    localStatus === "started"
      ? "bg-emerald-700"
      : localStatus === "closed"
        ? "bg-gray-500"
        : "bg-red-600";

  return (
    <View className={`p-3 rounded-lg ${bgColor}`}>
      <View className="flex-row gap-1 justify-center items-center">
        <View className="items-center">
          <Text className="text-2xl text-white font-cairo-bold">
            {String(timeLeft.seconds).padStart(2, "0")}
          </Text>
          <Text className="text-xs text-white font-cairo">ثانية</Text>
        </View>
        <Text className="text-xl text-white font-cairo-bold">:</Text>
        <View className="items-center">
          <Text className="text-2xl text-white font-cairo-bold">
            {String(timeLeft.minutes).padStart(2, "0")}
          </Text>
          <Text className="text-xs text-white font-cairo">دقيقة</Text>
        </View>
        <Text className="text-xl text-white font-cairo-bold">:</Text>
        <View className="items-center">
          <Text className="text-2xl text-white font-cairo-bold">
            {String(timeLeft.hours).padStart(2, "0")}
          </Text>
          <Text className="text-xs text-white font-cairo">ساعة</Text>
        </View>
        <Text className="text-xl text-white font-cairo-bold">:</Text>
        <View className="items-center">
          <Text className="text-2xl text-white font-cairo-bold">
            {String(timeLeft.days).padStart(2, "0")}
          </Text>
          <Text className="text-xs text-white font-cairo">يوم</Text>
        </View>
      </View>
    </View>
  );
};

interface AuctionCardProps {
  auction: OpenAuction;
  imageUrl: string;
}

const AuctionCard: React.FC<AuctionCardProps> = ({ auction, imageUrl }) => {
  const { withAuth } = useAuthGate();
  const displayPrice = auction.currentPrice || auction.startingPrice;

  const [toast, setToast] = useState<string | null>(null);
  const slideAnim = useState(new Animated.Value(100))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timeout = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timeout);
    }
  }, [toast]);

  const handleViewDetails = withAuth(() => {
    const startTime = new Date(auction.startTime);
    const now = new Date();
    if (now >= startTime) {
      router.push(`/auctions/${auction.auctionId}` as any);
    } else {
      setToast("المزاد لم يبدأ بعد!");
    }
  });

  return (
    <View
      className="overflow-hidden mr-3 bg-white rounded-2xl border border-gray-100 shadow-sm"
      style={{ width: CARD_WIDTH }}
    >
      <View className="relative">
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-48"
          resizeMode="cover"
        />
        <View className="absolute top-3 right-3 bg-white/90 rounded-full px-3 py-1.5 flex-row items-center gap-1">
          <Ionicons name="location" size={14} color="#059669" />
          <Text className="text-xs text-emerald-600 font-cairo-semibold">
            محافظة دمشق
          </Text>
        </View>
      </View>

      <View className="p-4">
        <View className="gap-2 mb-3">
          <View className="flex-row justify-between items-center">
            <View className="flex-row gap-2 items-center">
              <Ionicons name="cube-outline" size={18} color="#059669" />
              <Text className="text-sm text-gray-500 font-cairo">الكمية:</Text>
            </View>
            <Text className="text-sm text-emerald-700 font-cairo-bold">
              500 كغ
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <View className="flex-row gap-2 items-center">
              <Ionicons name="pricetag-outline" size={18} color="#059669" />
              <Text className="text-sm text-gray-500 font-cairo">
                السعر الأساسي:
              </Text>
            </View>
            <Text className="text-sm text-emerald-700 font-cairo-bold">
              {auction.startingPrice.toLocaleString()} ل.س
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <View className="flex-row gap-2 items-center">
              <Ionicons name="trending-up-outline" size={18} color="#059669" />
              <Text className="text-sm text-gray-500 font-cairo">
                أعلى عرض:
              </Text>
            </View>
            <Text className="text-sm text-emerald-700 font-cairo-bold">
              {displayPrice.toLocaleString()} ل.س
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <View className="flex-row gap-2 items-center">
              <Ionicons name="layers-outline" size={18} color="#059669" />
              <Text className="text-sm text-gray-500 font-cairo">
                عدد العروض:
              </Text>
            </View>
            <Text className="text-sm text-emerald-700 font-cairo-bold">
              0 عرض
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <View className="flex-row gap-2 items-center">
              <Ionicons name="calendar-outline" size={18} color="#059669" />
              <Text className="text-sm text-gray-500 font-cairo">
                تاريخ الانتهاء المزاد:
              </Text>
            </View>
            <Text className="text-sm text-gray-700 font-cairo-bold">
              {new Date(auction.endTime)
                .toLocaleDateString("en-GB")
                .replace(/\//g, "/")}
            </Text>
          </View>
        </View>

        <CountdownTimer
          endTime={auction.endTime}
          statusAuction={auction.status}
          startTime={auction.startTime}
        />

        <Pressable
          onPress={handleViewDetails}
          className="py-3 mt-3 bg-emerald-700 rounded-lg active:bg-emerald-800"
        >
          <Text className="text-center text-white font-cairo-bold">
            مزيد من التفاصيل
          </Text>
        </Pressable>
      </View>

      {toast && (
        <Animated.View
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 24,
            backgroundColor: "#fef2f2",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#fecaca",
            paddingVertical: 12,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 6,
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={{ flex: 1, color: "#b91c1c", textAlign: "right" }}>
            {toast}
          </Text>
          <Pressable onPress={() => setToast(null)} style={{ padding: 8 }}>
            <Ionicons name="close" size={20} color="#b91c1c" />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
};

const normalizeText = (value?: string | null) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

interface AuctionsTabProps {
  refreshKey: number;
  categoryFilter: CategoryFilterState;
  searchQuery: string;
}

export const AuctionsTab: React.FC<AuctionsTabProps> = ({
  refreshKey,
  categoryFilter,
  searchQuery,
}) => {
  const { withAuth } = useAuthGate();
  const [auctions, setAuctions] = useState<OpenAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const normalizedKeywords = useMemo(() => {
    if (!categoryFilter?.isActive) {
      return [];
    }
    const seeds =
      categoryFilter.keywords.length || !categoryFilter.label
        ? categoryFilter.keywords
        : [categoryFilter.label];
    const unique = new Set<string>();
    seeds.forEach((keyword) => {
      const normalized = normalizeText(keyword);
      if (normalized) unique.add(normalized);
    });
    return Array.from(unique);
  }, [categoryFilter]);
  const shouldCategoryFilter =
    categoryFilter?.isActive && normalizedKeywords.length > 0;
  const normalizedSearchTerm = normalizeText(searchQuery);
  const hasSearch = normalizedSearchTerm.length > 0;
  const visibleAuctions = useMemo(() => {
    if (!shouldCategoryFilter && !hasSearch) return auctions;
    return auctions.filter((auction) => {
      const fields = [
        auction.auctionTitle,
        auction.auctionDescription,
        (auction as any)?.cropName,
        (auction as any)?.productName,
        (auction as any)?.categoryName,
        (auction as any)?.categoryLabel,
      ];
      const haystacks = fields
        .map((value) => normalizeText(value))
        .filter((value) => value.length > 0);
      if (!haystacks.length) return false;
      const matchesCategory =
        !shouldCategoryFilter ||
        normalizedKeywords.some((keyword) =>
          haystacks.some((text) => text.includes(keyword))
        );
      const matchesSearch =
        !hasSearch ||
        haystacks.some((text) => text.includes(normalizedSearchTerm));
      return matchesCategory && matchesSearch;
    });
  }, [
    auctions,
    normalizedKeywords,
    shouldCategoryFilter,
    hasSearch,
    normalizedSearchTerm,
  ]);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getOpenAuctions();
        console.log("response", response);
        // Handle different response structures
        const auctionsData = response?.data || response || [];
        setAuctions(Array.isArray(auctionsData) ? auctionsData : []);
      } catch (err: any) {
        console.error("Error fetching auctions:", err);
        console.error("Error details:", {
          message: err?.message,
          status: err?.status,
          response: err?.response,
          stack: err?.stack,
        });
        // Show more specific error message if available
        const errorMessage = err?.message || err?.response?.message || "فشل في تحميل المزادات";
        setError(errorMessage);
        setAuctions([]); // Clear auctions on error
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, [refreshKey]);

  if (loading) {
    return (
      <View className="items-center py-12">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="py-6">
        <Text className="text-center text-red-500 font-cairo">{error}</Text>
      </View>
    );
  }

  if (auctions.length === 0) {
    return (
      <View className="py-6">
        <Text className="text-center text-gray-500 font-cairo">
          لا توجد مزادات مفتوحة حالياً
        </Text>
      </View>
    );
  }

  if ((shouldCategoryFilter || hasSearch) && visibleAuctions.length === 0) {
    let message = "لا توجد مزادات مطابقة للفلتر الحالي";
    if (hasSearch) {
      const trimmed = searchQuery.trim();
      message = trimmed.length
        ? `لا توجد مزادات مطابقة لعبارة "${trimmed}"`
        : "لا توجد مزادات مطابقة لعبارة البحث";
    } else if (categoryFilter.label) {
      message = `لا توجد مزادات مطابقة لقسم ${categoryFilter.label}`;
    }
    return (
      <View className="py-6">
        <Text className="text-center text-gray-500 font-cairo">{message}</Text>
      </View>
    );
  }

  return (
    <View>
      <View className="flex-row justify-between items-center px-4 mb-4">
        <Text className="text-xl text-gray-800 font-cairo-bold">
          أحدث المزايدات
        </Text>
        <Pressable onPress={withAuth(() => { })} className="active:opacity-70">
          <Text className="text-emerald-700 font-cairo-semibold">عرض الكل</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_SPACING}
      >
        {visibleAuctions.map((auction, index) => (
          <AuctionCard
            key={auction.auctionId}
            auction={auction}
            imageUrl={getRandomImage(index)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default AuctionsTab;
