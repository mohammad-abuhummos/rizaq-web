import { createOffer, listOffersByTender } from "@/services/offer";
import {
  awardTender,
  getTender,
  listTendersCreatedByUser,
} from "@/services/tender";
import { getAuthUser } from "@/storage/auth-storage";
import type { Offer } from "@/types/offer";
import type { Tender } from "@/types/tender";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type SortKey = "lowest" | "highest" | "newest";

const SORT_OPTIONS: {
  id: SortKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "lowest", label: "أقل سعر", icon: "trending-down-outline" },
  { id: "highest", label: "أعلى سعر", icon: "trending-up-outline" },
  { id: "newest", label: "الأحدث", icon: "time-outline" },
];

const STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  open: "مفتوحة",
  closed: "مغلقة",
  awarded: "مكتملة",
};

const formatNumber = (value?: number | null, unit?: string | null) => {
  if (value === null || value === undefined) return unit ? `0 ${unit}` : "0";
  try {
    return `${Number(value).toLocaleString()}${unit ? ` ${unit}` : ""}`;
  } catch {
    return `${value}${unit ? ` ${unit}` : ""}`;
  }
};

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return "غير محدد";
  try {
    return `${Number(value).toLocaleString()} ل.س`;
  } catch {
    return `${value} ل.س`;
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return "غير متوفر";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "غير متوفر";
  try {
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return date.toLocaleDateString();
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "غير متوفر";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "غير متوفر";
  try {
    return date.toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return date.toLocaleString();
  }
};

const StatCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <View className="flex-1 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
    <View className="flex-row items-center justify-between">
      <Text className="text-sm text-gray-500 font-cairo-semibold">{label}</Text>
      <View className="w-10 h-10 items-center justify-center rounded-2xl bg-emerald-50">
        <Ionicons name={icon} size={18} color="#047857" />
      </View>
    </View>
    <Text
      className="mt-3 text-lg text-gray-900 font-cairo-bold"
      numberOfLines={1}
    >
      {value}
    </Text>
  </View>
);

const SortPill: React.FC<{
  option: (typeof SORT_OPTIONS)[number];
  active: boolean;
  onPress: () => void;
}> = ({ option, active, onPress }) => (
  <Pressable
    onPress={onPress}
    className={`flex-row items-center gap-2 px-4 py-2 rounded-full border ${
      active ? "bg-emerald-600 border-emerald-600" : "bg-white border-gray-200"
    }`}
  >
    <Ionicons
      name={option.icon}
      size={16}
      color={active ? "#FFFFFF" : "#047857"}
    />
    <Text
      className={`text-xs font-cairo-semibold ${active ? "text-white" : "text-emerald-700"}`}
    >
      {option.label}
    </Text>
  </Pressable>
);

const OfferCard: React.FC<{
  offer: Offer;
  highlight?: boolean;
  bestOffer?: Offer;
}> = ({ offer, highlight, bestOffer }) => {
  const price = (offer as any).offeredPrice ?? (offer as any).price ?? 0;
  const createdAt = offer.createdAt
    ? formatDateTime(offer.createdAt)
    : "غير معروف";

  return (
    <View
      className={`p-5 mb-4 rounded-3xl border ${
        highlight
          ? "bg-emerald-50 border-amber-300 shadow-lg shadow-emerald-100" // ✅ تصميم خاص للعرض المقبول
          : "bg-white border-gray-100 shadow-sm"
      }`}
    >
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-1 mr-3 items-end">
          <Text className="text-sm text-gray-500 font-cairo">السعر المقدم</Text>
          <Text
            className="text-xl text-gray-900 font-cairo-bold"
            numberOfLines={1}
          >
            {formatCurrency(price)}
          </Text>
        </View>

        {highlight ? (
          <View className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300">
            <Text className="text-xs text-emerald-800 font-cairo-bold">
              ✅ عرض مقبول
            </Text>
          </View>
        ) : bestOffer && bestOffer.offerId === offer.offerId ? (
          <View className="px-3 py-1 rounded-full bg-amber-100 border border-amber-200">
            <Text className="text-xs text-amber-700 font-cairo-bold">
              🏆 أفضل عرض
            </Text>
          </View>
        ) : null}
      </View>

      <View className="gap-2">
        {offer.status ? (
          <View className="flex-row items-center gap-2">
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color="#10B981"
            />
            <Text className="text-xs text-gray-600 font-cairo">
              الحالة: {offer.status}
            </Text>
          </View>
        ) : null}
        <View className="flex-row items-center gap-2">
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text className="text-xs text-gray-500 font-cairo">
            تم التقديم في {createdAt}
          </Text>
        </View>
        {offer.description ? (
          <Text
            className="mt-2 text-sm text-gray-600 font-cairo"
            numberOfLines={5}
          >
            {offer.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export default function TenderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tenderId = Number(id);
  const [tender, setTender] = useState<Tender | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [price, setPrice] = useState<string>("");
  const [desc, setDesc] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortKey>("lowest");
  const [authUserId, setAuthUserId] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [awardingOfferId, setAwardingOfferId] = useState<number | null>(null);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!tenderId) {
        setError("تعذر تحديد المناقصة المطلوبة.");
        setLoading(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const [tenderRes, offersRes] = await Promise.all([
          getTender(tenderId),
          listOffersByTender(tenderId),
        ]);

        const tenderData = ((tenderRes as any)?.data ?? tenderRes) as any;
        setTender(tenderData);
        const offersData = (offersRes as any)?.data ?? offersRes;
        setOffers(Array.isArray(offersData) ? offersData : []);

        // Determine ownership
        try {
          const auth = await getAuthUser<{ userId?: number }>();
          const uid = auth?.userId ?? null;
          setAuthUserId(uid ?? null);
          if (uid) {
            const ownerId = tenderData?.createdByUserId;
            if (ownerId) {
              setIsOwner(String(ownerId) === String(uid));
            } else {
              const mine = await listTendersCreatedByUser(uid).catch(
                () => ({ data: [] }) as any
              );
              const myList = (mine as any)?.data ?? mine;
              const found =
                Array.isArray(myList) &&
                myList.some(
                  (t: any) => String(t?.tenderId) === String(tenderId)
                );
              setIsOwner(Boolean(found));
            }
          } else {
            setIsOwner(false);
          }
        } catch {
          setIsOwner(false);
        }
      } catch (e: any) {
        setError(e?.message || "فشل في تحميل تفاصيل المناقصة.");
        setTender(null);
        setOffers([]);
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [tenderId]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const normalizedOffers = useMemo(() => {
    return (offers || []).map((o) => ({
      ...o,
      _price: (o as any).offeredPrice ?? (o as any).price ?? 0,
      _createdAt: o.createdAt ? new Date(o.createdAt) : null,
    }));
  }, [offers]);

  const bestOffer = useMemo(() => {
    const valid = normalizedOffers.filter((o) => (o._price ?? 0) > 0);
    const pool = valid.length ? valid : normalizedOffers;
    return pool.reduce<null | (typeof normalizedOffers)[number]>(
      (prev, current) => {
        if (!prev) return current;
        return (current._price ?? Infinity) < (prev._price ?? Infinity)
          ? current
          : prev;
      },
      null
    );
  }, [normalizedOffers]);

  const sortedOffers = useMemo(() => {
    const copy = [...normalizedOffers];
    if (sortBy === "lowest") {
      copy.sort((a, b) => (a._price || 0) - (b._price || 0));
    } else if (sortBy === "highest") {
      copy.sort((a, b) => (b._price || 0) - (a._price || 0));
    } else {
      copy.sort((a, b) => {
        const at = a._createdAt?.getTime() || 0;
        const bt = b._createdAt?.getTime() || 0;
        return bt - at;
      });
    }
    return copy;
  }, [normalizedOffers, sortBy]);

  const handleSubmitOffer = useCallback(async () => {
    if (isOwner) {
      Alert.alert("تنبيه", "لا يمكنك تقديم عرض على مناقصتك الخاصة");
      return;
    }
    if (submitting) return;
    if (!tenderId) {
      Alert.alert("خطأ", "تعذر العثور على رقم المناقصة.");
      return;
    }

    const value = Number(price);
    if (!value || Number.isNaN(value) || value <= 0) {
      Alert.alert("تنبيه", "يرجى إدخال سعر صالح للمناقصة.");
      return;
    }

    setSubmitting(true);
    try {
      const auth = await getAuthUser<{ userId?: number }>();
      const supplierUserId = auth?.userId;
      if (!supplierUserId) {
        throw new Error("يجب تسجيل الدخول قبل تقديم العرض.");
      }

      const res = await createOffer(supplierUserId, {
        tenderId,
        price: value,
        description: desc.trim() || undefined,
      });

      const created = (res as any)?.data ?? res;
      setOffers((prev) => [created as Offer, ...prev]);
      setPrice("");
      setDesc("");

      Alert.alert("تم الإرسال", "تم تسجيل عرضك بنجاح.");
    } catch (e: any) {
      Alert.alert("خطأ", e?.message || "فشل في إرسال العرض.");
    } finally {
      setSubmitting(false);
    }
  }, [desc, price, submitting, tenderId, isOwner]);

  const derivedStatus = useMemo(() => {
    const st = (tender?.status || "").toLowerCase();
    return tender?.awardedOfferId ? "awarded" : st;
  }, [tender]);

  const renderOffers = useMemo(() => {
    if (!sortedOffers.length) {
      return (
        <View className="items-center justify-center py-12">
          <View className="w-20 h-20 items-center justify-center rounded-full bg-amber-50 border border-amber-200">
            <Ionicons name="documents-outline" size={36} color="#B45309" />
          </View>
          <Text className="mt-4 text-lg text-gray-800 font-cairo-bold">
            لا توجد عروض حتى الآن
          </Text>
          <Text className="mt-2 text-sm text-gray-500 font-cairo text-center">
            كن أول من يقدم عرضاً لهذه المناقصة لتحصل على فرصة الفوز.
          </Text>
        </View>
      );
    }

    const statusLc = (tender?.status || "").toLowerCase();
    const canAwardTender = isOwner && !["closed", "draft"].includes(statusLc);

    const awardedIds = Array.isArray(tender?.awardedOfferIds)
      ? tender.awardedOfferIds
      : tender?.awardedOfferId
        ? [tender.awardedOfferId]
        : [];

    return sortedOffers.map((offer) => {
      const offerId = (offer as any).offerId as number | undefined;
      const awardingThis = !!offerId && awardingOfferId === offerId;
      const isAwarded = !!offerId && awardedIds.includes(offerId);

      const chatIds = (offer as any).chatConversationIds || [];
      const hasChats = Array.isArray(chatIds) && chatIds.length > 0;

      return (
        <View key={String(offerId ?? (offer as any)._createdAt)}>
          <OfferCard offer={offer as Offer} highlight={isAwarded} />

          {canAwardTender && offerId ? (
            <Pressable
              onPress={async () => {
                const statusLcInner = (tender?.status || "").toLowerCase();
                if (["closed", "draft"].includes(statusLcInner)) {
                  Alert.alert(
                    "غير متاح",
                    "لا يمكن إسناد المناقصة بعد إغلاقها أو كونها مسودة"
                  );
                  return;
                }
                if (!tenderId || awardingOfferId) return;

                const isAlreadyAwarded = awardedIds.includes(offerId);
                Alert.alert(
                  isAlreadyAwarded ? "إلغاء الإسناد" : "تأكيد الإسناد",
                  isAlreadyAwarded
                    ? "هل تريد إلغاء إسناد هذا العرض؟"
                    : "هل تريد قبول هذا العرض وإسناد المناقصة؟",
                  [
                    { text: "إلغاء", style: "cancel" },
                    {
                      text: "تأكيد",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          setAwardingOfferId(offerId);

                          // تحديث محلي فوري
                          setTender((prev) => {
                            if (!prev) return prev;
                            const updated = [...(prev.awardedOfferIds || [])];
                            if (isAlreadyAwarded) {
                              return {
                                ...prev,
                                awardedOfferIds: updated.filter(
                                  (id) => id !== offerId
                                ),
                              };
                            } else {
                              updated.push(offerId);
                              return { ...prev, awardedOfferIds: updated };
                            }
                          });

                          await awardTender(tenderId, offerId);

                          Alert.alert(
                            isAlreadyAwarded ? "تم الإلغاء" : "تم الإسناد",
                            isAlreadyAwarded
                              ? "تم إلغاء الإسناد بنجاح."
                              : "تم قبول العرض بنجاح."
                          );

                          setTimeout(() => fetchData(), 800);
                        } catch (e: any) {
                          Alert.alert(
                            "خطأ",
                            e?.message || "فشل في إسناد المناقصة."
                          );
                        } finally {
                          setAwardingOfferId(null);
                        }
                      },
                    },
                  ]
                );
              }}
              disabled={awardingThis}
              className={`mb-3 -mt-2 mx-1 flex-row items-center justify-center gap-2 px-4 py-2 rounded-2xl ${
                awardingThis
                  ? "bg-emerald-300"
                  : isAwarded
                    ? "bg-red-600"
                    : "bg-emerald-600"
              } active:opacity-80`}
            >
              {awardingThis ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name={isAwarded ? "close-circle" : "checkmark-circle"}
                  size={18}
                  color="#FFFFFF"
                />
              )}
              <Text className="text-sm text-white font-cairo-semibold">
                {awardingThis
                  ? "جارٍ التنفيذ..."
                  : isAwarded
                    ? "إلغاء الإسناد"
                    : "قبول هذا العرض"}
              </Text>
            </Pressable>
          ) : null}

          {isAwarded &&
            Array.isArray(tender?.chatConversationIds) &&
            tender.chatConversationIds.length > 0 && (
              <Pressable
                onPress={() => {
                  const firstChatId = tender.chatConversationIds[0];
                  if (firstChatId) {
                    router.push(`/chat/${firstChatId}`);
                  } else {
                    Alert.alert(
                      "تنبيه",
                      "لا توجد محادثة مرتبطة بهذه المناقصة."
                    );
                  }
                }}
                className="mb-6 mx-1 flex-row items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 active:opacity-80"
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color="#FFFFFF"
                />
                <Text className="text-sm text-white font-cairo-semibold">
                  اذهب إلى المحادثة
                </Text>
              </Pressable>
            )}
        </View>
      );
    });
  }, [
    sortedOffers,
    isOwner,
    awardingOfferId,
    tender?.awardedOfferIds,
    tenderId,
    fetchData,
  ]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-gray-50">
        <View className="flex-1">
          <View className="pb-6 bg-emerald-600 rounded-b-3xl shadow-md">
            <View className="px-5 pt-14 pb-6">
              <View className="flex-row items-center justify-between">
                <Pressable
                  onPress={() => router.back()}
                  className="p-2 rounded-full bg-white/10"
                  hitSlop={8}
                >
                  <Ionicons name="arrow-forward" size={22} color="white" />
                </Pressable>
                <View className="flex-1 mr-3 items-end">
                  <Text className="text-2xl text-white font-cairo-bold">
                    تفاصيل المناقصة
                  </Text>
                  <Text
                    className="mt-1 text-sm text-emerald-100 font-cairo"
                    numberOfLines={2}
                  >
                    راجع بيانات المناقصة وتابع العروض المقدمة من الموردين
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1, marginTop: -32 }}
            contentContainerStyle={{
              paddingTop: 32,
              paddingHorizontal: 20,
              paddingBottom: 48,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchData(true)}
                colors={["#059669"]}
                tintColor="#059669"
              />
            }
          >
            {loading ? (
              <View className="items-center justify-center py-16">
                <ActivityIndicator size="large" color="#059669" />
                <Text className="mt-3 text-sm text-gray-500 font-cairo">
                  جاري تحميل تفاصيل المناقصة...
                </Text>
              </View>
            ) : (
              <>
                {error && (
                  <View className="px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-2xl">
                    <Text className="text-sm text-red-700 font-cairo">
                      {error}
                    </Text>
                    <Pressable
                      onPress={() => fetchData()}
                      className="mt-3 self-end px-4 py-2 bg-red-500 rounded-xl active:bg-red-600"
                    >
                      <Text className="text-xs text-white font-cairo-semibold">
                        إعادة المحاولة
                      </Text>
                    </Pressable>
                  </View>
                )}

                {!error && tender ? (
                  <>
                    <View className="p-5 mb-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1 mr-3 items-end">
                          <Text
                            className="text-lg text-gray-900 font-cairo-bold"
                            numberOfLines={2}
                          >
                            {tender.title || tender.cropName || "مناقصة زراعية"}
                          </Text>
                          {tender.status ? (
                            <Text
                              className="mt-1 text-xs font-cairo"
                              style={{
                                color:
                                  (tender?.awardedOfferId
                                    ? "awarded"
                                    : (tender?.status || "").toLowerCase()) ===
                                  "open"
                                    ? "#059669"
                                    : "#EF4444",
                              }}
                            >
                              الحالة:{" "}
                              {STATUS_LABELS[
                                tender?.awardedOfferId
                                  ? "awarded"
                                  : (tender?.status || "").toLowerCase()
                              ] || tender?.status}
                            </Text>
                          ) : null}
                        </View>
                        <View className="items-end">
                          <Text className="text-xs text-gray-500 font-cairo">
                            المحصول
                          </Text>
                          <Text
                            className="text-sm text-gray-800 font-cairo-semibold"
                            numberOfLines={1}
                          >
                            {tender.cropName || "غير محدد"}
                          </Text>
                        </View>
                      </View>

                      {(tender.status || "").toLowerCase() === "awarded" && (
                        <View className="p-3 mt-4 rounded-xl bg-emerald-50 border border-emerald-200">
                          <Text className="text-sm text-emerald-800 font-cairo-bold">
                            تم إسناد هذه المناقصة — مكتملة
                          </Text>
                        </View>
                      )}

                      {tender.description ? (
                        <Text className="mt-4 text-sm text-gray-600 font-cairo leading-6">
                          {tender.description}
                        </Text>
                      ) : null}

                      <View className="mt-5 flex-row gap-3">
                        <StatCard
                          icon="cube-outline"
                          label="الكمية المطلوبة"
                          value={formatNumber(tender.quantity, tender.unit)}
                        />
                        <StatCard
                          icon="cash-outline"
                          label="الميزانية القصوى"
                          value={formatCurrency(tender.maxBudget)}
                        />
                      </View>

                      <View className="mt-3 flex-row gap-3">
                        <StatCard
                          icon="calendar-outline"
                          label="تاريخ البداية"
                          value={formatDate(tender.startTime)}
                        />
                        <StatCard
                          icon="hourglass-outline"
                          label="تاريخ الإغلاق"
                          value={formatDate(tender.endTime)}
                        />
                      </View>

                      {tender.deliveryLocation ? (
                        <View className="flex-row items-center gap-2 mt-4">
                          <View className="w-10 h-10 items-center justify-center rounded-2xl bg-emerald-50">
                            <Ionicons
                              name="location-outline"
                              size={20}
                              color="#047857"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs text-gray-500 font-cairo">
                              موقع التسليم
                            </Text>
                            <Text
                              className="text-sm text-gray-800 font-cairo-semibold"
                              numberOfLines={2}
                            >
                              {tender.deliveryLocation}
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </View>

                    <View className="mb-8">
                      <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg text-gray-800 font-cairo-bold">
                          العروض المقدمة
                        </Text>
                        {bestOffer ? (
                          <View className="flex-row items-center gap-2">
                            <Ionicons
                              name="trophy-outline"
                              size={16}
                              color="#F59E0B"
                            />
                            <Text className="text-sm text-amber-600 font-cairo-semibold">
                              أفضل عرض: {formatCurrency(bestOffer._price)}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <View className="flex-row flex-wrap gap-2 mb-4">
                        {SORT_OPTIONS.map((option) => (
                          <SortPill
                            key={option.id}
                            option={option}
                            active={sortBy === option.id}
                            onPress={() => setSortBy(option.id)}
                          />
                        ))}
                      </View>

                      {renderOffers}
                    </View>

                    <View className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm">
                      <Text className="text-lg text-gray-800 font-cairo-bold">
                        تقديم عرض جديد
                      </Text>
                      <Text className="mt-1 text-sm text-gray-500 font-cairo">
                        أدخل السعر المقترح وأي تفاصيل إضافية ترغب بمشاركتها
                      </Text>

                      {isOwner ? (
                        <View className="p-4 mt-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
                          <Text className="text-sm text-yellow-800 font-cairo-bold">
                            لا يمكنك تقديم عرض على مناقصتك الخاصة
                          </Text>
                        </View>
                      ) : (
                        <>
                          <View className="mt-4 gap-4">
                            <View>
                              <Text className="text-sm text-gray-600 font-cairo-semibold mb-2">
                                السعر
                              </Text>
                              <TextInput
                                value={price}
                                onChangeText={setPrice}
                                keyboardType="numeric"
                                placeholder="أدخل السعر المقترح"
                                placeholderTextColor="#9CA3AF"
                                textAlign="right"
                                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-200 rounded-2xl font-cairo"
                              />
                            </View>

                            <View>
                              <Text className="text-sm text-gray-600 font-cairo-semibold mb-2">
                                الوصف (اختياري)
                              </Text>
                              <TextInput
                                value={desc}
                                onChangeText={setDesc}
                                placeholder="أضف تفاصيل إضافية حول العرض"
                                placeholderTextColor="#9CA3AF"
                                textAlign="right"
                                className="w-full px-4 py-3 text-base text-gray-900 bg-white border border-gray-200 rounded-2xl font-cairo"
                                multiline
                              />
                            </View>
                          </View>

                          <Pressable
                            onPress={handleSubmitOffer}
                            disabled={submitting}
                            className={`flex-row items-center justify-center gap-2 px-4 py-3 mt-5 rounded-2xl ${submitting ? "bg-emerald-400" : "bg-emerald-600"} active:bg-emerald-700`}
                          >
                            {submitting ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <Ionicons name="send" size={18} color="#FFFFFF" />
                            )}
                            <Text className="text-base text-white font-cairo-semibold">
                              {submitting
                                ? "جاري إرسال العرض..."
                                : "إرسال العرض الآن"}
                            </Text>
                          </Pressable>
                        </>
                      )}
                    </View>
                  </>
                ) : null}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </>
  );
}
