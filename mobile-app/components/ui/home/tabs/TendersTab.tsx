import { useAuthGate } from "@/hooks/useAuthGate";
import { listOpenTenders } from "@/services/tender";
import type { Tender } from "@/types/tender";
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

const TENDERS_IMAGES = [
  "https://images.pexels.com/photos/1437582/pexels-photo-1437582.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/296230/pexels-photo-296230.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1769277/pexels-photo-1769277.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1437586/pexels-photo-1437586.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/3917465/pexels-photo-3917465.jpeg?auto=compress&cs=tinysrgb&w=600",
];

const getTenderImage = (index: number) =>
  TENDERS_IMAGES[index % TENDERS_IMAGES.length];

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

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "-";
  }
};

export async function fetchOpenTenders(): Promise<Tender[]> {
  const response = await listOpenTenders();
  const data = response?.data;
  if (Array.isArray(data)) {
    return data;
  }
  return [];
}

const TenderCard: React.FC<{
  tender: Tender;
  onPress: () => void;
  imageUrl: string;
}> = ({ tender, onPress, imageUrl }) => {
  const title = tender.title || tender.cropName || "مناقصة زراعية";
  const unitLabel = tender.unit ? `${tender.unit}` : "";

  return (
    <View className="overflow-hidden mb-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
      <View className="relative">
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-44"
          resizeMode="cover"
        />
        <View className="absolute top-3 right-3 px-3 py-1.5 bg-emerald-600/90 rounded-full">
          <Text className="text-xs text-white font-cairo-semibold">
            مناقصة مفتوحة
          </Text>
        </View>
        {tender.status ? (
          <View className="absolute top-3 left-3 px-3 py-1.5 bg-black/40 rounded-full">
            <Text className="text-xs text-white font-cairo-semibold">
              {tender.status}
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
          {tender.cropName ? (
            <Text
              className="text-sm text-gray-500 font-cairo"
              numberOfLines={1}
            >
              المحصول: {tender.cropName}
            </Text>
          ) : null}
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 px-3 py-2 bg-amber-50 rounded-2xl border border-amber-100">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="cube-outline" size={18} color="#B45309" />
              <Text className="text-xs text-amber-700 font-cairo-semibold">
                الكمية المطلوبة
              </Text>
            </View>
            <Text className="text-base text-amber-900 font-cairo-bold">
              {formatNumber(tender.quantity)} {unitLabel}
            </Text>
          </View>

          <View className="flex-1 px-3 py-2 bg-amber-50 rounded-2xl border border-amber-100">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="cash-outline" size={18} color="#B45309" />
              <Text className="text-xs text-amber-700 font-cairo-semibold">
                الميزانية القصوى
              </Text>
            </View>
            <Text className="text-base text-amber-900 font-cairo-bold">
              {formatNumber(tender.maxBudget)} ل.س
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 flex-row items-center gap-2 px-3 py-2 bg-gray-50 rounded-2xl border border-gray-100">
            <Ionicons name="calendar-outline" size={18} color="#374151" />
            <View className="gap-0.5">
              <Text className="text-xs text-gray-500 font-cairo-semibold">
                بداية التقديم
              </Text>
              <Text className="text-sm text-gray-800 font-cairo-semibold">
                {formatDate(tender.startTime)}
              </Text>
            </View>
          </View>

          <View className="flex-1 flex-row items-center gap-2 px-3 py-2 bg-gray-50 rounded-2xl border border-gray-100">
            <Ionicons name="hourglass-outline" size={18} color="#374151" />
            <View className="gap-0.5">
              <Text className="text-xs text-gray-500 font-cairo-semibold">
                نهاية التقديم
              </Text>
              <Text className="text-sm text-gray-800 font-cairo-semibold">
                {formatDate(tender.endTime)}
              </Text>
            </View>
          </View>
        </View>

        {tender.deliveryLocation ? (
          <View className="flex-row items-center gap-2">
            <Ionicons name="location-outline" size={18} color="#6B7280" />
            <Text className="text-sm text-gray-500 font-cairo">
              موقع التسليم:{" "}
              <Text className="text-gray-800 font-cairo-semibold">
                {tender.deliveryLocation}
              </Text>
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={onPress}
          className="flex-row justify-center items-center gap-2 px-4 py-3 bg-amber-500 rounded-2xl active:bg-amber-600"
          hitSlop={4}
        >
          <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
          <Text className="text-sm text-white font-cairo-semibold">
            عرض تفاصيل المناقصة
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const normalizeText = (value?: string | null) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

interface TendersTabProps {
  categoryFilter: CategoryFilterState;
  searchQuery: string;
}

export const TendersTab: React.FC<TendersTabProps> = ({
  categoryFilter,
  searchQuery,
}) => {
  const { withAuth } = useAuthGate();
  const [tenders, setTenders] = useState<Tender[]>([]);
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
  const filteredTenders = useMemo(() => {
    if (!shouldCategoryFilter && !hasSearch) return tenders;
    return tenders.filter((tender) => {
      const fields = [
        tender.title,
        tender.description,
        tender.cropName,
        tender.deliveryLocation,
        tender.status,
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
    tenders,
    normalizedKeywords,
    shouldCategoryFilter,
    hasSearch,
    normalizedSearchTerm,
  ]);
  const visibleTenders = filteredTenders.slice(0, MAX_ITEMS_TO_SHOW);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchOpenTenders();
        setTenders(data);
      } catch (err: any) {
        console.error("Error fetching open tenders:", err);
        setError(err?.message || "فشل في تحميل المناقصات المفتوحة");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <View className="items-center py-12">
        <ActivityIndicator size="large" color="#F59E0B" />
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

  if (tenders.length === 0) {
    return (
      <View className="py-6">
        <Text className="text-center text-gray-500 font-cairo">
          لا توجد مناقصات مفتوحة حالياً
        </Text>
      </View>
    );
  }

  if ((shouldCategoryFilter || hasSearch) && filteredTenders.length === 0) {
    let message = "لا توجد مناقصات مطابقة للفلتر الحالي";
    if (hasSearch) {
      const trimmed = searchQuery.trim();
      message = trimmed.length
        ? `لا توجد مناقصات مطابقة لعبارة "${trimmed}"`
        : "لا توجد مناقصات مطابقة لعبارة البحث";
    } else if (categoryFilter.label) {
      message = `لا توجد مناقصات مطابقة لقسم ${categoryFilter.label}`;
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
          أحدث المناقصات المفتوحة
        </Text>
        {/* <View className="flex-row items-center gap-1">
                    <Ionicons name="document-outline" size={18} color="#B45309" />
                    <Text className="text-sm text-amber-700 font-cairo-semibold">فرصة للتوريد</Text>
                </View> */}
      </View>

      <FlatList
        data={visibleTenders}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.tenderId.toString()}
        renderItem={({ item, index }) => {
          const handlePress = withAuth(() => {
            router.push({
              pathname: "/tenders/[id]",
              params: { id: String(item.tenderId) },
            });
          });

          return (
            <View style={{ marginRight: 12 }}>
              <TenderCard
                tender={item}
                imageUrl={getTenderImage(index)}
                onPress={handlePress}
              />
            </View>
          );
        }}
        contentContainerStyle={{ paddingHorizontal: 8 ,flexDirection: 'row-reverse' }}
      />

      {tenders.length > MAX_ITEMS_TO_SHOW ? (
        <Text className="mt-2 text-sm text-gray-400 font-cairo">
          يوجد المزيد من المناقصات داخل قسم المناقصات
        </Text>
      ) : null}
    </View>
  );
};

export default TendersTab;
