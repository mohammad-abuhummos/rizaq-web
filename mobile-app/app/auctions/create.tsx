import {
  BottomSheetSelect,
  SelectOption,
} from "@/components/ui/bottom-sheet-select";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { createAuction } from "@/services/auction";
import { getCropsByFarm } from "@/services/crop";
import { listFarmsByUser } from "@/services/farm";
import { getAuthUser } from "@/storage/auth-storage";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SECOND_END_OFFSET_MS = 2 * 60 * 60 * 1000;
const MIN_SECOND_END_GAP_MS = 60 * 1000;

const combineDateWithTime = (baseDate: Date, timeSource: Date) => {
  const combined = new Date(baseDate);
  combined.setHours(timeSource.getHours(), timeSource.getMinutes(), 0, 0);
  combined.setSeconds(0);
  combined.setMilliseconds(0);
  return combined;
};

const getDefaultSecondEndTime = (start: Date, end: Date): Date | null => {
  const gap = end.getTime() - start.getTime();
  if (gap <= MIN_SECOND_END_GAP_MS) {
    return null;
  }

  let candidate = new Date(end.getTime() - SECOND_END_OFFSET_MS);
  if (candidate <= start) {
    candidate = new Date(end.getTime() - MIN_SECOND_END_GAP_MS);
    if (candidate <= start) {
      candidate = new Date(start.getTime() + MIN_SECOND_END_GAP_MS);
      if (candidate >= end) {
        return null;
      }
    }
  }

  return candidate;
};

type DatePickerField = "startTime" | "endTime" | "secondEndTime" | null;

type FieldKey =
  | "farm"
  | "crop"
  | "startingPrice"
  | "minIncrement"
  | "endTime"
  | "secondEndTime";

export default function CreateAuctionScreen() {
  const router = useRouter();
  const { createdFarmId, createdCropId } = useLocalSearchParams<{
    createdFarmId?: string;
    createdCropId?: string;
  }>();
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [minIncrement, setMinIncrement] = useState("");
  const initialTimes = useMemo(() => {
    const start = new Date();
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const second = getDefaultSecondEndTime(start, end);
    return { start, end, second };
  }, []);
  const [startTime, setStartTime] = useState<Date>(initialTimes.start);
  const [endTime, setEndTime] = useState<Date>(initialTimes.end);
  const [secondEndTime, setSecondEndTime] = useState<Date | null>(
    initialTimes.second
  );
  const [showDatePicker, setShowDatePicker] = useState<DatePickerField>(null);
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [crops, setCrops] = useState<any[]>([]);
  const [cropsLoading, setCropsLoading] = useState(false);
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [selectedCropStatus, setSelectedCropStatus] = useState<string | null>(
    null
  );
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldKey, string>>
  >({});

  const scrollViewRef = useRef<ScrollView | null>(null);
  const fieldLayouts = useRef<Partial<Record<FieldKey, number>>>({});
  const fieldOrder: FieldKey[] = [
    "farm",
    "crop",
    "startingPrice",
    "minIncrement",
    "endTime",
    "secondEndTime",
  ];

  const REQUIRED_FIELD_MESSAGE = "هذا الحقل مطلوب";
  const NUMERIC_VALUE_MESSAGE = "يرجى إدخال قيمة رقمية صالحة";
  const END_TIME_AFTER_START_MESSAGE =
    "يجب أن يكون وقت النهاية بعد وقت البداية";
  const SECOND_END_AFTER_START_MESSAGE =
    "يجب أن يكون وقت النهاية الثاني بعد وقت البداية";
  const SECOND_END_BEFORE_END_MESSAGE =
    "يجب أن يكون وقت النهاية الثاني قبل وقت النهاية الرئيسية";

  const handleFieldLayout = (field: FieldKey) => (event: LayoutChangeEvent) => {
    fieldLayouts.current[field] = event.nativeEvent.layout.y;
  };

  const scrollToField = (field: FieldKey) => {
    const position = fieldLayouts.current[field];
    if (typeof position === "number" && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: Math.max(position - 24, 0),
        animated: true,
      });
    }
  };

  const clearFieldError = (field: FieldKey) => {
    setFieldErrors((prev) => {
      if (!prev || !prev[field]) {
        return prev;
      }
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const selectedFarm = useMemo(() => {
    if (!selectedFarmId) return null;
    const idToMatch = selectedFarmId;
    return (
      farms.find((f: any) => {
        const fid = f?.farmLandId || f?.id || f?.farmId;
        return String(fid) === idToMatch;
      }) || null
    );
  }, [farms, selectedFarmId]);

  const selectedCrop = useMemo(() => {
    if (!selectedCropId) return null;
    const idToMatch = selectedCropId;
    return (
      crops.find((c: any) => {
        const cid = c?.cropId || c?.id;

        return String(cid) === idToMatch;
      }) || null
    );
  }, [crops, selectedCropId]);

  const farmOptions: SelectOption<string>[] = useMemo(
    () =>
      farms.map((f: any) => {
        const fid = f?.farmLandId || f?.id || f?.farmId;
        return {
          label: f?.name || `مزرعة #${fid}`,
          value: String(fid),
        };
      }),
    [farms]
  );

  const cropOptions: SelectOption<string>[] = useMemo(() => {
    return crops
      .filter((c: any) => c?.status === "available")
      .map((c: any) => {
        const cid = c?.cropId || c?.id;
        return {
          label: c?.name || `محصول #${cid}`,
          value: String(cid),
          status: c?.status || null,
        };
      });
  }, [crops]);

  const copyCropOptions: SelectOption<string>[] = useMemo(() => {
    return crops.map((c: any) => {
      const cid = c?.cropId || c?.id;
      return {
        label: c?.name || `محصول #${cid}`,
        value: String(cid),
        status: c?.status || null,
      };
    });
  }, [crops]);

  const fetchFarms = useCallback(
    async (state?: { cancelled: boolean }) => {
      if (!userId) return;
      if (state?.cancelled) return;

      if (!state?.cancelled) setLoading(true);
      try {
        const res = await listFarmsByUser(userId);
        const data = (res as any)?.data ?? res;
        if (!state?.cancelled && Array.isArray(data)) {
          setFarms(data);
        }
      } catch (e: any) {
        if (!state?.cancelled) {
          setError(e?.message || "Failed to load farms");
        }
      } finally {
        if (!state?.cancelled) {
          setLoading(false);
        }
      }
    },
    [userId]
  );

  useEffect(() => {
    getAuthUser().then((u) => {
      const id = (u as any)?.userId || (u as any)?.id;
      setUserId(typeof id === "number" ? id : parseInt(id, 10));
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      const state = { cancelled: false };
      fetchFarms(state);
      return () => {
        state.cancelled = true;
      };
    }, [fetchFarms])
  );

  const appliedParamSelectRef = useRef(false);

  useEffect(() => {
    if (appliedParamSelectRef.current) return;
    if (!farms.length) return;

    if (createdFarmId) {
      const f = farms.find((x: any) => {
        const fid = x?.farmLandId || x?.id || x?.farmId;
        return String(fid) === String(createdFarmId);
      });
      if (f) {
        const fid = f?.farmLandId || f?.id || f?.farmId;
        setSelectedFarmId(String(fid));
        clearFieldError("farm");
      }
    }

    if (createdCropId) {
      const timeout = setTimeout(() => {
        setSelectedCropId(String(createdCropId));
        clearFieldError("crop");
      }, 800);

      return () => clearTimeout(timeout);
    }

    appliedParamSelectRef.current = true;
  }, [farms, createdFarmId, createdCropId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!selectedFarmId) {
        if (!cancelled) {
          setCrops([]);
          setCropsLoading(false);
        }
        return;
      }
      if (!cancelled) {
        setCropsLoading(true);
      }
      try {
        const res = await getCropsByFarm(Number(selectedFarmId));
        const data = (res as any)?.data ?? res;
        if (!cancelled && Array.isArray(data)) {
          setCrops(data);
        }
      } catch {
        if (!cancelled) {
          setCrops([]);
        }
      } finally {
        if (!cancelled) {
          setCropsLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedFarmId]);

  useEffect(() => {
    if (secondEndTime === null) {
      const fallback = getDefaultSecondEndTime(startTime, endTime);
      if (fallback) {
        setSecondEndTime(fallback);
      }
    }
  }, [startTime, endTime, secondEndTime]);

  useEffect(() => {
    if (!secondEndTime) return;
    if (
      secondEndTime > startTime &&
      secondEndTime < endTime &&
      fieldErrors.secondEndTime
    ) {
      clearFieldError("secondEndTime");
    }
  }, [secondEndTime, startTime, endTime, fieldErrors.secondEndTime]);

  const validateFields = () => {
    const newErrors: Partial<Record<FieldKey, string>> = {};

    if (!selectedFarmId) newErrors.farm = REQUIRED_FIELD_MESSAGE;
    if (!selectedCropId) newErrors.crop = REQUIRED_FIELD_MESSAGE;

    if (!startingPrice.trim()) {
      newErrors.startingPrice = REQUIRED_FIELD_MESSAGE;
    } else if (Number.isNaN(Number(startingPrice))) {
      newErrors.startingPrice = NUMERIC_VALUE_MESSAGE;
    }

    if (!minIncrement.trim()) {
      newErrors.minIncrement = REQUIRED_FIELD_MESSAGE;
    } else if (Number.isNaN(Number(minIncrement))) {
      newErrors.minIncrement = NUMERIC_VALUE_MESSAGE;
    }

    if (endTime <= startTime) {
      newErrors.endTime = END_TIME_AFTER_START_MESSAGE;
    }

    if (secondEndTime) {
      if (secondEndTime <= startTime) {
        newErrors.secondEndTime = SECOND_END_AFTER_START_MESSAGE;
      } else if (secondEndTime >= endTime) {
        newErrors.secondEndTime = SECOND_END_BEFORE_END_MESSAGE;
      }
    }

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstField = fieldOrder.find((field) => newErrors[field]);
      if (firstField) {
        scrollToField(firstField);
      }
      return false;
    }

    return true;
  };

 const onCreate = async () => {
    if (!userId)
      return Alert.alert("تسجيل الدخول مطلوب", "الرجاء تسجيل الدخول أولاً");
  const isValid = validateFields();
  if (!isValid) {
    return;
  }

  setSubmitting(true);
  setError(null);
  try {
    const startingPriceValue = Number(startingPrice);
    const minIncrementValue = Number(minIncrement);
    const dto = {
      auctionTitle: title || undefined,
      auctionDescription: description || undefined,
      startingPrice: startingPriceValue || 0,
      minIncrement: minIncrementValue || 0,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      secondEndTime: secondEndTime?.toISOString() || undefined,
      cropId: Number(selectedCropId),
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    };

    const res = await createAuction(userId, dto);

    if (res.success) {
      const auctionId =
        (res as any)?.data?.auctionId ||
        (res as any)?.auctionId ||
        (res as any)?.id;

      if (auctionId) {
        Alert.alert("نجح", "تم إنشاء المزاد بنجاح ✅", [
          {
            text: "عرض المزاد",
            onPress: () =>
              router.replace(
                `/auctions/${encodeURIComponent(String(auctionId))}` as any
              ),
          },
        ]);
      } else {
        Alert.alert("نجح", "تم إنشاء المزاد بنجاح ✅", [
          {
            text: "عرض كل المزادات",
            onPress: () => router.replace("/auctions" as any),
          },
        ]);
      }
    } else {
      const detail =
        (res as any)?.error?.detail ||
        (res as any)?.message ||
        "فشل في إنشاء المزاد";
      setError(detail);
    }
  } catch (e: any) {
    const detail =
      e?.detail ||
      e?.response?.error?.detail ||
      e?.response?.detail ||
      e?.message;
    setError(detail || "فشل في إنشاء المزاد");
  } finally {
    setSubmitting(false);
  }
};


  const handleDateChange = (
    field: DatePickerField,
    event: any,
    selectedDate?: Date
  ) => {
    // Only update the date if user pressed "OK" (set)
    if (event.type === "set" && selectedDate) {
      if (field === "startTime") {
        setStartTime(selectedDate);
        if (endTime <= selectedDate) {
          setFieldErrors((prev) => ({
            ...prev,
            endTime: END_TIME_AFTER_START_MESSAGE,
          }));
        } else {
          clearFieldError("endTime");
        }
        if (secondEndTime) {
          if (secondEndTime <= selectedDate) {
            setFieldErrors((prev) => ({
              ...prev,
              secondEndTime: SECOND_END_AFTER_START_MESSAGE,
            }));
          } else if (secondEndTime >= endTime) {
            setFieldErrors((prev) => ({
              ...prev,
              secondEndTime: SECOND_END_BEFORE_END_MESSAGE,
            }));
          } else {
            clearFieldError("secondEndTime");
          }
        }
      } else if (field === "endTime") {
        setEndTime(selectedDate);
        if (selectedDate <= startTime) {
          setFieldErrors((prev) => ({
            ...prev,
            endTime: END_TIME_AFTER_START_MESSAGE,
          }));
        } else {
          clearFieldError("endTime");
        }
        if (secondEndTime && secondEndTime >= selectedDate) {
          setFieldErrors((prev) => ({
            ...prev,
            secondEndTime: SECOND_END_BEFORE_END_MESSAGE,
          }));
        }
      } else if (field === "secondEndTime") {
        setSecondEndTime(selectedDate);
        if (selectedDate <= startTime) {
          setFieldErrors((prev) => ({
            ...prev,
            secondEndTime: SECOND_END_AFTER_START_MESSAGE,
          }));
        } else if (selectedDate >= endTime) {
          setFieldErrors((prev) => ({
            ...prev,
            secondEndTime: SECOND_END_BEFORE_END_MESSAGE,
          }));
        } else {
          clearFieldError("secondEndTime");
        }
      }
    }

    // For iOS, close on dismiss
    if (Platform.OS === "ios" && event.type === "dismissed") {
      setShowDatePicker(null);
    }
  };

  const openAndroidDateTimePicker = (field: Exclude<DatePickerField, null>) => {
    try {
      if (field === "secondEndTime") {
        const baseValue =
          secondEndTime ||
          getDefaultSecondEndTime(startTime, endTime) ||
          endTime;
        DateTimePickerAndroid.open({
          value: baseValue,
          mode: "time",
          is24Hour: true,
          onChange: (event, selectedTime) => {
            if (event.type !== "set" || !selectedTime) return;
            const merged = combineDateWithTime(endTime, selectedTime);
            setSecondEndTime(merged);
            if (merged <= startTime) {
              setFieldErrors((prev) => ({
                ...prev,
                secondEndTime: SECOND_END_AFTER_START_MESSAGE,
              }));
            } else if (merged >= endTime) {
              setFieldErrors((prev) => ({
                ...prev,
                secondEndTime: SECOND_END_BEFORE_END_MESSAGE,
              }));
            } else {
              clearFieldError("secondEndTime");
            }
          },
        });
        return;
      }

      const currentValue = field === "startTime" ? startTime : endTime;
      // First open the date picker
      DateTimePickerAndroid.open({
        value: currentValue,
        mode: "date",
        onChange: (event, selectedDate) => {
          if (event.type !== "set" || !selectedDate) return;
          const datePart = selectedDate;
          // Then open the time picker
          try {
            DateTimePickerAndroid.open({
              value: currentValue,
              mode: "time",
              is24Hour: true,
              onChange: (event2, selectedTime) => {
                if (event2.type !== "set" || !selectedTime) return;
                const merged = new Date(datePart);
                merged.setHours(selectedTime.getHours());
                merged.setMinutes(selectedTime.getMinutes());
                merged.setSeconds(0);
                merged.setMilliseconds(0);
                if (field === "startTime") {
                  setStartTime(merged);
                  if (endTime <= merged) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      endTime: END_TIME_AFTER_START_MESSAGE,
                    }));
                  } else {
                    clearFieldError("endTime");
                  }
                  if (secondEndTime) {
                    if (secondEndTime <= merged) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        secondEndTime: SECOND_END_AFTER_START_MESSAGE,
                      }));
                    } else if (secondEndTime >= endTime) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        secondEndTime: SECOND_END_BEFORE_END_MESSAGE,
                      }));
                    } else {
                      clearFieldError("secondEndTime");
                    }
                  }
                } else if (field === "endTime") {
                  setEndTime(merged);
                  if (merged <= startTime) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      endTime: END_TIME_AFTER_START_MESSAGE,
                    }));
                  } else {
                    clearFieldError("endTime");
                  }
                  if (secondEndTime && secondEndTime >= merged) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      secondEndTime: SECOND_END_BEFORE_END_MESSAGE,
                    }));
                  }
                }
              },
            });
          } catch {}
        },
      });
    } catch {}
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "غير محدد";
    return date.toLocaleString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const showNoFarmsScreen = !loading && farms.length === 0;
  const showNoCropsScreen =
    selectedFarm && !loading && !cropsLoading && crops.length === 0;


  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: "white" }}>
        {/* Custom Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 48,
            paddingBottom: 16,
            backgroundColor: "#16A34A",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              onPress={() => router.back()}
              style={{ padding: 8, marginRight: 12 }}
            >
              <Ionicons name="arrow-forward" size={24} color="white" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 24,
                  color: "white",
                  fontFamily: "Cairo-Bold",
                  textAlign: "right",
                }}
              >
                إنشاء مزاد جديد
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#dcfce7",
                  marginTop: 4,
                  fontFamily: "Cairo-Regular",
                  textAlign: "right",
                }}
              >
                املأ التفاصيل لإنشاء مزاد لمحصولك
              </Text>
            </View>
          </View>
        </View>

        {/* No Farms Screen */}
        {showNoFarmsScreen && (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}
          >
            <View
              style={{
                padding: 24,
                marginBottom: 24,
                backgroundColor: "#fefce8",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#fde047",
              }}
            >
              <Text
                style={{
                  marginBottom: 12,
                  fontSize: 20,
                  textAlign: "center",
                  color: "#1f2937",
                  fontFamily: "Cairo-Bold",
                }}
              >
                لا توجد مزارع متاحة
              </Text>
              <Text
                style={{
                  marginBottom: 16,
                  fontSize: 16,
                  textAlign: "center",
                  color: "#4b5563",
                  fontFamily: "Cairo-Regular",
                }}
              >
                تحتاج إلى إنشاء مزرعة قبل أن تتمكن من إنشاء مزاد. تُستخدم
                المزارع لإدارة محاصيلك.
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/farms/create" as any)}
              style={{
                paddingHorizontal: 32,
                paddingVertical: 16,
                width: "100%",
                maxWidth: 400,
                backgroundColor: "#16A34A",
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  textAlign: "center",
                  color: "white",
                  fontFamily: "Cairo-Bold",
                }}
              >
                إنشاء أول مزرعة
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={{
                paddingHorizontal: 32,
                paddingVertical: 12,
                marginTop: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  textAlign: "center",
                  color: "#4b5563",
                  fontFamily: "Cairo-SemiBold",
                }}
              >
                رجوع
              </Text>
            </Pressable>
          </View>
        )}

        {/* No Crops Screen */}
        {showNoCropsScreen && (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}
          >
            <View
              style={{
                padding: 24,
                marginBottom: 24,
                backgroundColor: "#fefce8",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#fde047",
              }}
            >
              <Text
                style={{
                  marginBottom: 12,
                  fontSize: 20,
                  textAlign: "center",
                  color: "#1f2937",
                  fontFamily: "Cairo-Bold",
                }}
              >
                لا توجد محاصيل متاحة
              </Text>
              <Text
                style={{
                  marginBottom: 16,
                  fontSize: 16,
                  textAlign: "center",
                  color: "#4b5563",
                  fontFamily: "Cairo-Regular",
                }}
              >
                المزرعة المحددة ليس بها محاصيل. تحتاج إلى إنشاء محصول قبل أن
                تتمكن من إنشاء مزاد.
              </Text>
            </View>
            <Pressable
              onPress={() => {
                if (!selectedFarm) return;
                const fid =
                  selectedFarm?.farmLandId ||
                  selectedFarm?.id ||
                  selectedFarm?.farmId;
                router.push(
                  `/crops/create?farmLandId=${encodeURIComponent(String(fid))}` as any
                );
              }}
              style={{
                paddingHorizontal: 32,
                paddingVertical: 16,
                width: "100%",
                maxWidth: 400,
                backgroundColor: "#16A34A",
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  textAlign: "center",
                  color: "white",
                  fontFamily: "Cairo-Bold",
                }}
              >
                إنشاء محصول
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setSelectedFarmId(null);
                setSelectedCropId(null);
                clearFieldError("farm");
                clearFieldError("crop");
              }}
              style={{
                paddingHorizontal: 32,
                paddingVertical: 12,
                marginTop: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  textAlign: "center",
                  color: "#4b5563",
                  fontFamily: "Cairo-SemiBold",
                }}
              >
                اختر مزرعة أخرى
              </Text>
            </Pressable>
          </View>
        )}

        {/* Main Content */}
        {!showNoFarmsScreen && !showNoCropsScreen && (
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
          >
            {/* Loading State */}
            {loading && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  paddingVertical: 32,
                }}
              >
                <ActivityIndicator size="large" color="#16A34A" />
                <Text
                  style={{
                    marginRight: 12,
                    color: "#4b5563",
                    fontFamily: "Cairo-Regular",
                  }}
                >
                  جاري تحميل المزارع...
                </Text>
              </View>
            )}

            {/* Error Message - moved to bottom toast */}

            {!loading && (
              <>
                {/* Farm Selection Section */}
                <View style={{ marginBottom: 24 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        justifyContent: "center",
                        alignItems: "center",
                        marginLeft: 8,
                        width: 32,
                        height: 32,
                        backgroundColor: "#16A34A",
                        borderRadius: 16,
                      }}
                    >
                      <Text
                        style={{ color: "white", fontFamily: "Cairo-Bold" }}
                      >
                        ١
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 18,
                        color: "#1f2937",
                        fontFamily: "Cairo-SemiBold",
                        textAlign: "right",
                      }}
                    >
                      اختر المزرعة *
                    </Text>
                  </View>
                  <View onLayout={handleFieldLayout("farm")}>
                    <BottomSheetSelect
                      label="المزرعة"
                      placeholder="اختر المزرعة"
                      value={selectedFarmId ?? undefined}
                      options={farmOptions}
                      onChange={(value) => {
                        setSelectedFarmId(value);
                        setSelectedCropId(null);
                        setCrops([]);
                        clearFieldError("farm");
                        clearFieldError("crop");
                      }}
                      required
                      disabled={!farmOptions.length}
                      error={fieldErrors.farm}
                    />
                  </View>
                  <Pressable
                    onPress={() => router.push("/farms/create" as any)}
                    style={{
                      paddingVertical: 12,
                      marginTop: 8,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: "#d1d5db",
                      borderStyle: "dashed",
                    }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        color: "#4b5563",
                        fontFamily: "Cairo-SemiBold",
                      }}
                    >
                      + إنشاء مزرعة جديدة
                    </Text>
                  </Pressable>
                </View>

                {/* Crop Selection Section */}
                {selectedFarm && (
                  <View style={{ marginBottom: 24 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <View
                        style={{
                          justifyContent: "center",
                          alignItems: "center",
                          marginLeft: 8,
                          width: 32,
                          height: 32,
                          backgroundColor: "#2563eb",
                          borderRadius: 16,
                        }}
                      >
                        <Text
                          style={{ color: "white", fontFamily: "Cairo-Bold" }}
                        >
                          ٢
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 18,
                          color: "#1f2937",
                          fontFamily: "Cairo-SemiBold",
                          textAlign: "right",
                        }}
                      >
                        اختر المحصول *
                      </Text>
                    </View>
                    {cropsLoading ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 12,
                        }}
                      >
                        <ActivityIndicator color="#2563eb" />
                        <Text
                          style={{
                            marginRight: 8,
                            color: "#4b5563",
                            fontFamily: "Cairo-Regular",
                          }}
                        >
                          جاري تحميل المحاصيل...
                        </Text>
                      </View>
                    ) : (
                      <>
                        <View onLayout={handleFieldLayout("crop")}>
                          <BottomSheetSelect
                            label="إنشاء نسخة "
                            placeholder="انسخ المحصول"
                            value={selectedCropId ?? undefined}
                            options={copyCropOptions}
                            onChange={(value) => {
                              setSelectedCropId(value);
                              clearFieldError("crop");

                              const selectedCrop = crops.find(
                                (c: any) => String(c.cropId || c.id) === value
                              );
                              if (!selectedCrop) return;

                              const fid =
                                selectedFarm?.farmLandId ||
                                selectedFarm?.id ||
                                selectedFarm?.farmId;

                              // 🔹 نرسل بيانات المحصول إلى شاشة الإنشاء
                              router.push({
                                pathname: "/crops/create",
                                params: {
                                  farmLandId: String(fid),
                                  copyFrom: JSON.stringify(selectedCrop), // نمرر بيانات المحصول كـ JSON
                                  returnTo:
                                    encodeURIComponent("/auctions/create"), // بعد الإنشاء يرجع لشاشة المزاد
                                },
                              } as any);
                            }}
                            required
                            disabled={!copyCropOptions.length}
                            error={fieldErrors.crop}
                          />
                        </View>

                        <View onLayout={handleFieldLayout("crop")}>
                          <BottomSheetSelect
                            label="المحصول"
                            placeholder="اختر المحصول"
                            value={selectedCropId ?? undefined}
                            options={cropOptions}
                            onChange={(value) => {
                              setSelectedCropId(value);
                              clearFieldError("crop");
                            }}
                            required
                            disabled={!cropOptions.length}
                            error={fieldErrors.crop}
                          />
                        </View>
                        <Pressable
                          onPress={() => {
                            const fid =
                              selectedFarm?.farmLandId ||
                              selectedFarm?.id ||
                              selectedFarm?.farmId;
                            router.push(
                              `/crops/create?farmLandId=${encodeURIComponent(String(fid))}` as any
                            );
                          }}
                          style={{
                            paddingVertical: 12,
                            marginTop: 8,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: "#d1d5db",
                            borderStyle: "dashed",
                          }}
                        >
                          <Text
                            style={{
                              textAlign: "center",
                              color: "#4b5563",
                              fontFamily: "Cairo-SemiBold",
                            }}
                          >
                            + إنشاء محصول جديد
                          </Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                )}

                {selectedCrop && (
                  <>
                    <View style={{ marginBottom: 24 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <View
                          style={{
                            justifyContent: "center",
                            alignItems: "center",
                            marginLeft: 8,
                            width: 32,
                            height: 32,
                            backgroundColor: "#ea580c",
                            borderRadius: 16,
                          }}
                        >
                          <Text
                            style={{ color: "white", fontFamily: "Cairo-Bold" }}
                          >
                            ٣
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 18,
                            color: "#1f2937",
                            fontFamily: "Cairo-SemiBold",
                            textAlign: "right",
                          }}
                        >
                          تفاصيل المزاد
                        </Text>
                      </View>

                      {/* Title */}
                      <View style={{ marginBottom: 12 }}>
                        <Text
                          style={{
                            marginBottom: 8,
                            color: "#374151",
                            fontFamily: "Cairo-SemiBold",
                            textAlign: "right",
                          }}
                        >
                          العنوان
                        </Text>
                        <TextInput
                          value={title}
                          onChangeText={setTitle}
                          placeholder="مثال: محصول قمح ممتاز"
                          placeholderTextColor="#9CA3AF"
                          style={{
                            padding: 12,
                            backgroundColor: "white",
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: "#d1d5db",
                            fontFamily: "Cairo-Regular",
                            textAlign: "right",
                          }}
                        />
                      </View>

                      {/* Description */}
                      <View style={{ marginBottom: 12 }}>
                        <Text
                          style={{
                            marginBottom: 8,
                            color: "#374151",
                            fontFamily: "Cairo-SemiBold",
                            textAlign: "right",
                          }}
                        >
                          الوصف
                        </Text>
                        <TextInput
                          value={description}
                          onChangeText={setDescription}
                          placeholder="اكتب وصفاً للمزاد..."
                          placeholderTextColor="#9CA3AF"
                          multiline
                          numberOfLines={3}
                          style={{
                            padding: 12,
                            backgroundColor: "white",
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: "#d1d5db",
                            fontFamily: "Cairo-Regular",
                            textAlign: "right",
                            textAlignVertical: "top",
                          }}
                        />
                      </View>

                      {/* Starting Price */}
                      <View
                        style={{ marginBottom: 12 }}
                        onLayout={handleFieldLayout("startingPrice")}
                      >
                        <Text
                          style={{
                            marginBottom: 8,
                            color: "#374151",
                            fontFamily: "Cairo-SemiBold",
                            textAlign: "right",
                          }}
                        >
                          السعر الابتدائي *
                        </Text>
                        <TextInput
                          value={startingPrice}
                          onChangeText={(value) => {
                            setStartingPrice(value);
                            clearFieldError("startingPrice");
                          }}
                          placeholder="0.00"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="decimal-pad"
                          style={[
                            {
                              padding: 12,
                              backgroundColor: "white",
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: "#d1d5db",
                              fontFamily: "Cairo-Regular",
                              textAlign: "right",
                            },
                            fieldErrors.startingPrice && {
                              borderColor: "#dc2626",
                              backgroundColor: "#fef2f2",
                            },
                          ]}
                        />
                        {!!fieldErrors.startingPrice && (
                          <Text
                            style={{
                              color: "#dc2626",
                              fontFamily: "Cairo-Regular",
                              textAlign: "right",
                              marginTop: 6,
                            }}
                          >
                            {fieldErrors.startingPrice}
                          </Text>
                        )}
                      </View>

                      {/* Min Bid Increment */}
                      <View
                        style={{ marginBottom: 12 }}
                        onLayout={handleFieldLayout("minIncrement")}
                      >
                        <Text
                          style={{
                            marginBottom: 8,
                            color: "#374151",
                            fontFamily: "Cairo-SemiBold",
                            textAlign: "right",
                          }}
                        >
                          الحد الأدنى لزيادة المزايدة *
                        </Text>
                        <TextInput
                          value={minIncrement}
                          onChangeText={(value) => {
                            setMinIncrement(value);
                            clearFieldError("minIncrement");
                          }}
                          placeholder="0.00"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="decimal-pad"
                          style={[
                            {
                              padding: 12,
                              backgroundColor: "white",
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: "#d1d5db",
                              fontFamily: "Cairo-Regular",
                              textAlign: "right",
                            },
                            fieldErrors.minIncrement && {
                              borderColor: "#dc2626",
                              backgroundColor: "#fef2f2",
                            },
                          ]}
                        />
                        {!!fieldErrors.minIncrement && (
                          <Text
                            style={{
                              color: "#dc2626",
                              fontFamily: "Cairo-Regular",
                              textAlign: "right",
                              marginTop: 6,
                            }}
                          >
                            {fieldErrors.minIncrement}
                          </Text>
                        )}
                      </View>

                      {/* Auction Images (optional) */}
                      <View style={{ marginBottom: 16 }}>
                        <Text
                          style={{
                            marginBottom: 8,
                            color: "#374151",
                            fontFamily: "Cairo-SemiBold",
                            textAlign: "right",
                          }}
                        >
                          صور المزاد
                        </Text>
                        <View
                          style={{
                            padding: 12,
                            backgroundColor: "white",
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: "#d1d5db",
                          }}
                        >
                          <ImageUploader
                            maxImages={10}
                            autoUpload
                            buttonLabel="اختر صور المزاد"
                            onImagesUploaded={(urls) => {
                              setImageUrls(urls);
                            }}
                            initialImages={imageUrls}
                          />
                        </View>
                        <Text
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            color: "#6b7280",
                            fontFamily: "Cairo-Regular",
                            textAlign: "right",
                          }}
                        >
                          يمكنك ترك هذا الحقل فارغاً إذا كنت تفضل استخدام صور المحصول فقط.
                        </Text>
                      </View>

                      {/* Start Time */}
                      <View style={{ marginBottom: 12 }}>
                        <Text
                          style={{
                            marginBottom: 8,
                            color: "#374151",
                            fontFamily: "Cairo-SemiBold",
                            textAlign: "right",
                          }}
                        >
                          وقت البداية *
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            Platform.OS === "android"
                              ? openAndroidDateTimePicker("startTime")
                              : setShowDatePicker("startTime")
                          }
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: 12,
                            backgroundColor: "white",
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: "#d1d5db",
                          }}
                        >
                          <Text
                            style={{
                              color: "#16A34A",
                              fontFamily: "Cairo-SemiBold",
                            }}
                          >
                            تغيير
                          </Text>
                          <Text
                            style={{
                              color: "#1f2937",
                              fontFamily: "Cairo-Regular",
                            }}
                          >
                            {formatDateTime(startTime)}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* End Time */}
                      <View
                        style={{ marginBottom: 12 }}
                        onLayout={handleFieldLayout("endTime")}
                      >
                        <Text
                          style={{
                            marginBottom: 8,
                            color: "#374151",
                            fontFamily: "Cairo-SemiBold",
                            textAlign: "right",
                          }}
                        >
                          وقت النهاية *
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            Platform.OS === "android"
                              ? openAndroidDateTimePicker("endTime")
                              : setShowDatePicker("endTime")
                          }
                          style={[
                            {
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: 12,
                              backgroundColor: "white",
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: "#d1d5db",
                            },
                            fieldErrors.endTime && {
                              borderColor: "#dc2626",
                              backgroundColor: "#fef2f2",
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: "#16A34A",
                              fontFamily: "Cairo-SemiBold",
                            }}
                          >
                            تغيير
                          </Text>
                          <Text
                            style={{
                              color: "#1f2937",
                              fontFamily: "Cairo-Regular",
                            }}
                          >
                            {formatDateTime(endTime)}
                          </Text>
                        </TouchableOpacity>
                        {!!fieldErrors.endTime && (
                          <Text
                            style={{
                              color: "#dc2626",
                              fontFamily: "Cairo-Regular",
                              textAlign: "right",
                              marginTop: 6,
                            }}
                          >
                            {fieldErrors.endTime}
                          </Text>
                        )}
                      </View>

                      {/* Second End Time */}
                      <View
                        style={{ marginBottom: 12 }}
                        onLayout={handleFieldLayout("secondEndTime")}
                      >
                        <Text
                          style={{
                            marginBottom: 8,
                            color: "#374151",
                            fontFamily: "Cairo-SemiBold",
                            textAlign: "right",
                          }}
                        >
                          وقت النهاية الثاني
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            Platform.OS === "android"
                              ? openAndroidDateTimePicker("secondEndTime")
                              : setShowDatePicker("secondEndTime")
                          }
                          style={[
                            {
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: 12,
                              backgroundColor: "white",
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: "#d1d5db",
                            },
                            fieldErrors.secondEndTime && {
                              borderColor: "#dc2626",
                              backgroundColor: "#fef2f2",
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: "#16A34A",
                              fontFamily: "Cairo-SemiBold",
                            }}
                          >
                            {secondEndTime ? "تغيير" : "تحديد"}
                          </Text>
                          <Text
                            style={{
                              color: "#1f2937",
                              fontFamily: "Cairo-Regular",
                            }}
                          >
                            {formatDateTime(secondEndTime)}
                          </Text>
                        </TouchableOpacity>
                        {secondEndTime && (
                          <Pressable
                            onPress={() => {
                              setSecondEndTime(null);
                              clearFieldError("secondEndTime");
                            }}
                            style={{ marginTop: 8 }}
                          >
                            <Text
                              style={{
                                textAlign: "center",
                                color: "#dc2626",
                                fontFamily: "Cairo-SemiBold",
                              }}
                            >
                              مسح وقت النهاية الثاني
                            </Text>
                          </Pressable>
                        )}
                        {!!fieldErrors.secondEndTime && (
                          <Text
                            style={{
                              color: "#dc2626",
                              fontFamily: "Cairo-Regular",
                              textAlign: "right",
                              marginTop: 6,
                            }}
                          >
                            {fieldErrors.secondEndTime}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Submit Button */}
                    <Pressable
                      onPress={onCreate}
                      disabled={submitting}
                      style={{
                        paddingVertical: 16,
                        borderRadius: 12,
                        backgroundColor: submitting ? "#9ca3af" : "#16A34A",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        elevation: 4,
                      }}
                    >
                      {submitting ? (
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <ActivityIndicator color="white" />
                          <Text
                            style={{
                              marginRight: 8,
                              fontSize: 18,
                              textAlign: "center",
                              color: "white",
                              fontFamily: "Cairo-Bold",
                            }}
                          >
                            جاري إنشاء المزاد...
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={{
                            fontSize: 18,
                            textAlign: "center",
                            color: "white",
                            fontFamily: "Cairo-Bold",
                          }}
                        >
                          إنشاء المزاد
                        </Text>
                      )}
                    </Pressable>
                  </>
                )}
              </>
            )}

            {/* Date/Time Pickers (iOS inline only) */}
            {Platform.OS === "ios" && showDatePicker === "startTime" && (
              <DateTimePicker
                key="startTime"
                value={startTime}
                mode="datetime"
                display="spinner"
                onChange={(event, date) =>
                  handleDateChange("startTime", event, date)
                }
                minimumDate={new Date()}
              />
            )}
            {Platform.OS === "ios" && showDatePicker === "endTime" && (
              <DateTimePicker
                key="endTime"
                value={endTime}
                mode="datetime"
                display="spinner"
                onChange={(event, date) =>
                  handleDateChange("endTime", event, date)
                }
                minimumDate={new Date()}
              />
            )}
            {Platform.OS === "ios" && showDatePicker === "secondEndTime" && (
              <DateTimePicker
                key="secondEndTime"
                value={
                  secondEndTime ||
                  getDefaultSecondEndTime(startTime, endTime) ||
                  endTime
                }
                mode="time"
                display="spinner"
                onChange={(event, date) =>
                  handleDateChange(
                    "secondEndTime",
                    event,
                    date ? combineDateWithTime(endTime, date) : undefined
                  )
                }
              />
            )}
          </ScrollView>
        )}
        {/* Bottom Toast Error */}
        {!!error && (
          <View
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
            }}
          >
            <Text
              style={{
                flex: 1,
                color: "#b91c1c",
                fontFamily: "Cairo-Regular",
                textAlign: "right",
              }}
            >
              {error}
            </Text>
            <Pressable
              onPress={() => setError(null)}
              style={{ padding: 8, marginLeft: 8 }}
            >
              <Ionicons name="close" size={20} color="#b91c1c" />
            </Pressable>
          </View>
        )}
      </View>
    </>
  );
}
