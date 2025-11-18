import { useAuthGate } from "@/hooks/useAuthGate";
import { listDirectListings } from "@/services/direct";
import type { DirectListing } from "@/types/direct";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import type { CategoryFilterState } from "../types";

const MAX_ITEMS_TO_SHOW = 3;

const LIVE_SELL_IMAGES = [
  "https://images.pexels.com/photos/892769/pexels-photo-892769.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/533360/pexels-photo-533360.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/235294/pexels-photo-235294.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1437632/pexels-photo-1437632.jpeg?auto=compress&cs=tinysrgb&w=600",
];

const getListingImage = (index: number) =>
  LIVE_SELL_IMAGES[index % LIVE_SELL_IMAGES.length];

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return "-";
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return "-";
  }

  try {
    return numericValue.toLocaleString();
  } catch {
    return String(numericValue);
  }
};

export async function fetchLiveSell(): Promise<DirectListing[]> {
  const response = await listDirectListings();
  const data = response?.data;
  if (Array.isArray(data)) {
    return data;
  }
  return [];
}

const LiveSellCard: React.FC<{
  listing: DirectListing;
  onPress: () => void;
  imageUrl: string;
}> = ({ listing, onPress, imageUrl }) => {
  const title = listing.title || listing.cropName || "عرض للبيع المباشر";
  const unitLabel = listing.unit ? `${listing.unit}` : "";

  return (
    <View className="overflow-hidden mb-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
      <View className="relative">
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-44"
          resizeMode="cover"
        />
        <View className="absolute top-3 right-3 px-3 py-1.5 bg-black/45 rounded-full">
          <Text className="text-xs text-white font-cairo-semibold">
            بيع مباشر
          </Text>
        </View>
        {listing.status ? (
          <View className="absolute top-3 left-3 px-3 py-1.5 bg-emerald-600/90 rounded-full">
            <Text className="text-xs text-white font-cairo-semibold">
              {listing.status}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="p-4 gap-4">
        <View className="gap-1">
          <Text
            className="text-lg text-gray-900 font-cairo-bold"
            numberOfLines={1}
          >
            {title}
          </Text>
          {listing.cropName ? (
            <Text
              className="text-sm text-gray-500 font-cairo"
              numberOfLines={1}
            >
              {listing.cropName}
            </Text>
          ) : null}
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 px-3 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="pricetag-outline" size={18} color="#047857" />
              <Text className="text-xs text-emerald-700 font-cairo-semibold">
                السعر للوحدة
              </Text>
            </View>
            <Text className="text-base text-emerald-900 font-cairo-bold">
              {formatNumber(listing.unitPrice)} {unitLabel}
            </Text>
          </View>

          <View className="flex-1 px-3 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="cube-outline" size={18} color="#047857" />
              <Text className="text-xs text-emerald-700 font-cairo-semibold">
                الكمية المتاحة
              </Text>
            </View>
            <Text className="text-base text-emerald-900 font-cairo-bold">
              {formatNumber(listing.availableQty)} {unitLabel}
            </Text>
          </View>
        </View>

        {listing.minOrderQty ? (
          <View className="flex-row items-center gap-2">
            <Ionicons name="layers-outline" size={18} color="#6B7280" />
            <Text className="text-sm text-gray-500 font-cairo">
              الحد الأدنى للطلب:{" "}
              <Text className="text-gray-800 font-cairo-semibold">
                {formatNumber(listing.minOrderQty)} {unitLabel}
              </Text>
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={onPress}
          className="flex-row justify-center items-center gap-2 px-4 py-3 bg-emerald-600 rounded-2xl active:bg-emerald-700"
          hitSlop={4}
        >
          <Ionicons name="cart" size={18} color="#FFFFFF" />
          <Text className="text-sm text-white font-cairo-semibold">
            شراء الآن
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const normalizeText = (value?: string | null) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

interface LiveSellTabProps {
  categoryFilter: CategoryFilterState;
  searchQuery: string;
}

export const LiveSellTab: React.FC<LiveSellTabProps> = ({
  categoryFilter,
  searchQuery,
}) => {
  const { withAuth } = useAuthGate();
  const [listings, setListings] = useState<DirectListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const normalizedKeywords = useMemo(() => {
    if (!categoryFilter?.isActive) return [];
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
  const filteredListings = useMemo(() => {
    if (!shouldCategoryFilter && !hasSearch) return listings;
    return listings.filter((listing) => {
      const fields = [listing.title, listing.cropName, listing.status];
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
    listings,
    normalizedKeywords,
    shouldCategoryFilter,
    hasSearch,
    normalizedSearchTerm,
  ]);
  const displayedListings = filteredListings.slice(0, MAX_ITEMS_TO_SHOW);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchLiveSell();
        setListings(data);
      } catch (err: any) {
        console.error("Error fetching live sell listings:", err);
        setError(err?.message || "فشل في تحميل عروض البيع المباشر");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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

  if (listings.length === 0) {
    return (
      <View className="py-6">
        <Text className="text-center text-gray-500 font-cairo">
          لا توجد عروض بيع مباشر حالياً
        </Text>
      </View>
    );
  }

  if ((shouldCategoryFilter || hasSearch) && filteredListings.length === 0) {
    let message = "لا توجد عروض بيع مطابقة للفلتر الحالي";
    if (hasSearch) {
      const trimmed = searchQuery.trim();
      message = trimmed.length
        ? `لا توجد عروض بيع مطابقة لعبارة "${trimmed}"`
        : "لا توجد عروض بيع مطابقة لعبارة البحث";
    } else if (categoryFilter.label) {
      message = `لا توجد عروض بيع مباشر لقسم ${categoryFilter.label}`;
    }
    return (
      <View className="py-6">
        <Text className="text-center text-gray-500 font-cairo">{message}</Text>
      </View>
    );
  }

  return (
    <View>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl text-gray-800 font-cairo-bold">
          أحدث عروض البيع المباشر
        </Text>
        {/* <View className="flex-row items-center gap-1">
                    <Ionicons name="flash-outline" size={18} color="#059669" />
                    <Text className="text-sm text-emerald-700 font-cairo-semibold">مباشر الآن</Text>
                </View> */}
      </View>

      <FlatList
        data={displayedListings}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.listingId.toString()}
        contentContainerStyle={{
          paddingHorizontal: 8,
          flexDirection: "row-reverse", // ✅ للعرض من اليمين إلى اليسار (عربي)
        }}
        renderItem={({ item, index }) => {
          const handlePress = withAuth(() => {
            router.push({
              pathname: "/direct/buy",
              params: { id: String(item.listingId) },
            });
          });

          return (
            <View style={{ marginHorizontal: 8 }}>
              <LiveSellCard
                listing={item}
                imageUrl={getListingImage(index)}
                onPress={handlePress}
              />
            </View>
          );
        }}
      />

      {/* {listings.length > MAX_ITEMS_TO_SHOW ? (
                <Text className="mt-2 text-sm text-gray-400 font-cairo">يوجد المزيد من العروض داخل قسم البيع المباشر</Text>
            ) : null} */}
    </View>
  );
};

export default LiveSellTab;
