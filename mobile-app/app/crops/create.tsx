import {
  BottomSheetSelect,
  SelectOption,
} from "@/components/ui/bottom-sheet-select";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { createCrop } from "@/services/crop";
import { listFarmsByUser } from "@/services/farm";
import { listProducts } from "@/services/product";
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
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type DatePickerField = "harvestDate" | "expiryDate" | null;

const QUALITY_GRADE_OPTIONS: SelectOption[] = [
  { label: "A", value: "A" },
  { label: "B", value: "B" },
  { label: "C", value: "C" },
  { label: "D", value: "D" },
  { label: "F", value: "F" },
];

const SIZE_OPTIONS: SelectOption[] = [
  { label: "صغير (Small)", value: "Small" },
  { label: "متوسط (Medium)", value: "Medium" },
  { label: "كبير (Large)", value: "Large" },
  { label: "كبير جدًا (X-Large)", value: "X-Large" },
];

const COLOR_OPTIONS: SelectOption[] = [
  { label: "أخضر", value: "أخضر" },
  { label: "أحمر", value: "أحمر" },
  { label: "أصفر", value: "أصفر" },
  { label: "برتقالي", value: "برتقالي" },
  { label: "أبيض", value: "أبيض" },
  { label: "بني", value: "بني" },
  { label: "أخرى", value: "أخرى" },
];

const PACKING_METHOD_OPTIONS: SelectOption[] = [
  { label: "صناديق خشبية", value: "صناديق خشبية" },
  { label: "صناديق كرتونية", value: "صناديق كرتونية" },
  { label: "أكياس بلاستيكية", value: "أكياس بلاستيكية" },
  { label: "أكياس شبكية", value: "أكياس شبكية" },
  { label: "بدون تغليف", value: "بدون تغليف" },
];

type FieldKey =
  | "farm"
  | "product"
  | "name"
  | "variety"
  | "quantity"
  | "unit"
  | "qualityGrade"
  | "size"
  | "color"
  | "packingMethod"
  | "supplyScope"
  | "expiryDate"
  | "imageUrls";

export default function CreateCropScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const returnTo = (params as any)?.returnTo
    ? decodeURIComponent(String((params as any)?.returnTo))
    : null;
  const initialFarmId = String((params as any)?.farmLandId || "");
  const [userId, setUserId] = useState<number | null>(null);
  const [farms, setFarms] = useState<any[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(
    initialFarmId ? initialFarmId : null
  );
  const [productId, setProductId] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [name, setName] = useState("");
  const [variety, setVariety] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [harvestDate, setHarvestDate] = useState<Date>(new Date());
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<DatePickerField>(null);
  const [qualityGrade, setQualityGrade] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [packingMethod, setPackingMethod] = useState("");
  const [supplyScope, setSupplyScope] = useState("");
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
    "product",
    "name",
    "variety",
    "quantity",
    "unit",
    "qualityGrade",
    "size",
    "color",
    "packingMethod",
    "supplyScope",
    "expiryDate",
    "imageUrls",
  ];
  const expiryAfterHarvestMessage =
    "يجب أن يكون تاريخ الانتهاء بعد تاريخ الحصاد";

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

  useEffect(() => {
    (async () => {
      setProductsLoading(true);
      try {
        const res = await listProducts();
        const data = (res as any)?.data ?? res;
        if (Array.isArray(data)) setProducts(data);
      } catch (e: any) {
        setError(e?.message || "فشل في تحميل المنتجات");
      } finally {
        setProductsLoading(false);
      }
    })();
  }, []);

  const hasAppliedCopyRef = useRef(false);

  useEffect(() => {
    const { copyFrom } = params as any;
    if (hasAppliedCopyRef.current) return; // ✅ تأكد نطبق مرة واحدة فقط
    if (copyFrom) {
      try {
        const cropData = JSON.parse(copyFrom);
        setProductId(String(cropData.productId || ""));
        setName(cropData.name + " (نسخة)");
        setVariety(cropData.variety || "");
        setQuantity(String(cropData.quantity || ""));
        setUnit(cropData.unit || "kg");
        setHarvestDate(new Date());
        setExpiryDate(
          cropData.expiryDate ? new Date(cropData.expiryDate) : null
        );
        setQualityGrade(cropData.qualityGrade || "");
        setSize(cropData.size || "");
        setColor(cropData.color || "");
        setPackingMethod(cropData.packingMethod || "");
        setSupplyScope(cropData.supplyScope || "");
        hasAppliedCopyRef.current = true; // ✅ علم إنه تمت العملية
      } catch (e) {
        console.log("Error parsing copyFrom:", e);
      }
    }
  }, []);

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

  const productOptions: SelectOption<string>[] = useMemo(
    () =>
      products.map((p: any) => {
        const pid = p?.productId || p?.id;
        return {
          label: p?.nameAr || p?.nameEn || `منتج #${pid}`,
          value: String(pid),
        };
      }),
    [products]
  );

  useEffect(() => {
    getAuthUser().then((u) => {
      const id = (u as any)?.userId || (u as any)?.id;
      setUserId(typeof id === "number" ? id : parseInt(id, 10));
    });
  }, []);

  const fetchFarms = useCallback(
    async (state?: { cancelled: boolean }) => {
      if (!userId) return;
      if (state?.cancelled) return;

      if (!state?.cancelled) setFarmsLoading(true);
      try {
        const res = await listFarmsByUser(userId);
        const data = (res as any)?.data ?? res;
        if (!state?.cancelled && Array.isArray(data)) {
          setFarms(data);
        }
      } catch (e: any) {
        if (!state?.cancelled) {
          setError((prev) => prev ?? (e?.message || "فشل في تحميل المزارع"));
        }
      } finally {
        if (!state?.cancelled) {
          setFarmsLoading(false);
        }
      }
    },
    [userId]
  );

  useFocusEffect(
    useCallback(() => {
      const state = { cancelled: false };
      fetchFarms(state);
      return () => {
        state.cancelled = true;
      };
    }, [fetchFarms])
  );

  useEffect(() => {
    if (!farms.length) return;
    if (selectedFarmId) {
      const exists = farms.some((f: any) => {
        const fid = f?.farmLandId || f?.id || f?.farmId;
        return String(fid) === String(selectedFarmId);
      });
      if (!exists) {
        setSelectedFarmId(null);
      }
    } else if (initialFarmId) {
      const existsInitial = farms.some((f: any) => {
        const fid = f?.farmLandId || f?.id || f?.farmId;
        return String(fid) === String(initialFarmId);
      });
      if (existsInitial) {
        setSelectedFarmId(String(initialFarmId));
      }
    }
  }, [farms, initialFarmId, selectedFarmId]);

  useEffect(() => {
    if (!productId) return;
    const exists = productOptions.some((opt) => opt.value === productId);
    if (!exists) {
      setProductId("");
    }
  }, [productOptions, productId]);

  const validateFields = () => {
    const requiredMessage = "هذا الحقل مطلوب";
    const numericMessage = "يرجى إدخال قيمة رقمية صالحة";
    const newErrors: Partial<Record<FieldKey, string>> = {};

    if (!selectedFarmId) newErrors.farm = requiredMessage;
    if (!productId) newErrors.product = requiredMessage;
    if (!name.trim()) newErrors.name = requiredMessage;
    if (!variety.trim()) newErrors.variety = requiredMessage;
    if (!quantity.trim()) {
      newErrors.quantity = requiredMessage;
    } else {
      const numericValue = Number(quantity);
      if (Number.isNaN(numericValue)) {
        newErrors.quantity = numericMessage;
      }
    }
    if (!unit.trim()) newErrors.unit = requiredMessage;
    if (!qualityGrade) newErrors.qualityGrade = requiredMessage;
    if (!size) newErrors.size = requiredMessage;
    if (!color) newErrors.color = requiredMessage;
    if (!packingMethod) newErrors.packingMethod = requiredMessage;
    if (!supplyScope.trim()) newErrors.supplyScope = requiredMessage;
    if (expiryDate && expiryDate < harvestDate)
      newErrors.expiryDate = expiryAfterHarvestMessage;
    if (!imageUrls || imageUrls.length === 0)
      newErrors.imageUrls = "يجب رفع صورة واحدة على الأقل";

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
    const isValid = validateFields();
    if (!isValid) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const dto = {
        farmId: parseInt(String(selectedFarmId), 10),
        productId: parseInt(productId, 10),
        name: name || undefined,
        variety: variety || undefined,
        quantity: Number(quantity) || 0,
        unit,
        harvestDate: harvestDate.toISOString(),
        expiryDate: expiryDate?.toISOString() || undefined,
        qualityGrade: qualityGrade || undefined,
        size: size || undefined,
        color: color || undefined,
        packingMethod: packingMethod || undefined,
        supplyScope: supplyScope || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      } as any;

      const res = await createCrop(dto);
      const farmIdFromDto = dto.farmId;
      const newCropId =
        (res as any)?.data?.cropId ||
        (res as any)?.cropId ||
        (res as any)?.id ||
        null;

      Alert.alert("نجح", "تم إنشاء المحصول بنجاح", [
        {
          text: "حسناً",
          onPress: () => {
            const params = {
              createdFarmId: String(farmIdFromDto),
              createdCropId: String(newCropId || ""),
            };

            if (returnTo) {
              router.replace({
                pathname: returnTo,
                params,
              } as any);
            } else {
              router.replace({
                pathname: "/auctions/create",
                params,
              } as any);
            }
          },
        },
      ]);
    } catch (e: any) {
      setError(e?.message || "فشل في إنشاء المحصول");
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
      if (field === "harvestDate") {
        setHarvestDate(selectedDate);
        if (expiryDate && expiryDate < selectedDate) {
          setFieldErrors((prev) => ({
            ...prev,
            expiryDate: expiryAfterHarvestMessage,
          }));
        } else {
          clearFieldError("expiryDate");
        }
      } else if (field === "expiryDate") {
        setExpiryDate(selectedDate);
        if (selectedDate < harvestDate) {
          setFieldErrors((prev) => ({
            ...prev,
            expiryDate: expiryAfterHarvestMessage,
          }));
        } else {
          clearFieldError("expiryDate");
        }
      }
    }

    // For iOS, close on dismiss
    if (Platform.OS === "ios" && event.type === "dismissed") {
      setShowDatePicker(null);
    }
  };

  const openAndroidDatePicker = (field: Exclude<DatePickerField, null>) => {
    const currentValue =
      field === "harvestDate" ? harvestDate : expiryDate || new Date();
    DateTimePickerAndroid.open({
      value: currentValue,
      mode: "date",
      onChange: (event, selectedDate) => {
        if (event.type === "set" && selectedDate) {
          if (field === "harvestDate") {
            setHarvestDate(selectedDate);
            if (expiryDate && expiryDate < selectedDate) {
              setFieldErrors((prev) => ({
                ...prev,
                expiryDate: expiryAfterHarvestMessage,
              }));
            } else {
              clearFieldError("expiryDate");
            }
          } else {
            setExpiryDate(selectedDate);
            if (selectedDate < harvestDate) {
              setFieldErrors((prev) => ({
                ...prev,
                expiryDate: expiryAfterHarvestMessage,
              }));
            } else {
              clearFieldError("expiryDate");
            }
          }
        }
      },
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "غير محدد";
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const showNoFarms = !farmsLoading && farmOptions.length === 0;
  const showNoProducts = !productsLoading && productOptions.length === 0;
  const canShowDetails = !!(selectedFarmId && productId);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
      >
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
                  إضافة محصول جديد
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
                  املأ التفاصيل لإضافة محصول للمزرعة
                </Text>
              </View>
            </View>
          </View>

          {showNoFarms ? (
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
                  تحتاج إلى إنشاء مزرعة قبل أن تتمكن من إضافة محصول جديد.
                  تُستخدم المزارع لإدارة محاصيلك.
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
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === "ios" ? "interactive" : "on-drag"
              }
            >
              {!!error && (
                <View
                  style={{
                    padding: 16,
                    marginBottom: 16,
                    backgroundColor: "#fef2f2",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#fecaca",
                    flexDirection: "row",
                    alignItems: "center",
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

              {/* Farm Selection */}
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
                    <Text style={{ color: "white", fontFamily: "Cairo-Bold" }}>
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
                {farmsLoading ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                    }}
                  >
                    <ActivityIndicator color="#16A34A" />
                    <Text
                      style={{
                        marginRight: 8,
                        color: "#4b5563",
                        fontFamily: "Cairo-Regular",
                      }}
                    >
                      جاري تحميل المزارع...
                    </Text>
                  </View>
                ) : (
                  <>
                    <View
                      onLayout={handleFieldLayout("farm")}
                      style={{ marginBottom: 12 }}
                    >
                      <BottomSheetSelect
                        label="المزرعة"
                        placeholder="اختر المزرعة"
                        value={selectedFarmId ?? undefined}
                        options={farmOptions}
                        onChange={(value) => {
                          setSelectedFarmId(value);
                          setProductId("");
                          clearFieldError("farm");
                          clearFieldError("product");
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
                  </>
                )}
              </View>

              {/* Product Selection */}
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
                    <Text style={{ color: "white", fontFamily: "Cairo-Bold" }}>
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
                    اختر المنتج *
                  </Text>
                </View>
                {productsLoading ? (
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
                      جاري تحميل المنتجات...
                    </Text>
                  </View>
                ) : showNoProducts ? (
                  <View
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Cairo-SemiBold",
                        color: "#1f2937",
                        textAlign: "right",
                        marginBottom: 4,
                      }}
                    >
                      لا توجد منتجات متاحة
                    </Text>
                    <Text
                      style={{
                        fontFamily: "Cairo-Regular",
                        color: "#4b5563",
                        textAlign: "right",
                      }}
                    >
                      الرجاء إضافة منتجات جديدة من لوحة التحكم قبل إنشاء
                      المحصول.
                    </Text>
                  </View>
                ) : (
                  <View onLayout={handleFieldLayout("product")}>
                    <BottomSheetSelect
                      label="المنتج"
                      placeholder="اختر المنتج"
                      value={productId || undefined}
                      options={productOptions}
                      onChange={(value) => {
                        setProductId(value);
                        clearFieldError("product");
                      }}
                      required
                      disabled={!selectedFarmId}
                      searchable={productOptions.length > 5}
                      error={fieldErrors.product}
                    />
                  </View>
                )}
              </View>

              {canShowDetails ? (
                <>
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
                      تفاصيل المحصول
                    </Text>
                  </View>

                  {/* Name */}
                  <View
                    style={{ marginBottom: 12 }}
                    onLayout={handleFieldLayout("name")}
                  >
                    <Text
                      style={{
                        marginBottom: 8,
                        color: "#374151",
                        fontFamily: "Cairo-SemiBold",
                        textAlign: "right",
                      }}
                    >
                      الاسم *
                    </Text>
                    <TextInput
                      value={name}
                      onChangeText={(value) => {
                        setName(value);
                        clearFieldError("name");
                      }}
                      placeholder="اسم المحصول"
                      placeholderTextColor="#9CA3AF"
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
                        fieldErrors.name && {
                          borderColor: "#dc2626",
                          backgroundColor: "#fef2f2",
                        },
                      ]}
                    />
                    {!!fieldErrors.name && (
                      <Text
                        style={{
                          color: "#dc2626",
                          fontFamily: "Cairo-Regular",
                          textAlign: "right",
                          marginTop: 6,
                        }}
                      >
                        {fieldErrors.name}
                      </Text>
                    )}
                  </View>

                  {/* Variety */}
                  <View
                    style={{ marginBottom: 12 }}
                    onLayout={handleFieldLayout("variety")}
                  >
                    <Text
                      style={{
                        marginBottom: 8,
                        color: "#374151",
                        fontFamily: "Cairo-SemiBold",
                        textAlign: "right",
                      }}
                    >
                      الصنف *
                    </Text>
                    <TextInput
                      value={variety}
                      onChangeText={(value) => {
                        setVariety(value);
                        clearFieldError("variety");
                      }}
                      placeholder="مثال: صنف محلي"
                      placeholderTextColor="#9CA3AF"
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
                        fieldErrors.variety && {
                          borderColor: "#dc2626",
                          backgroundColor: "#fef2f2",
                        },
                      ]}
                    />
                    {!!fieldErrors.variety && (
                      <Text
                        style={{
                          color: "#dc2626",
                          fontFamily: "Cairo-Regular",
                          textAlign: "right",
                          marginTop: 6,
                        }}
                      >
                        {fieldErrors.variety}
                      </Text>
                    )}
                  </View>

                  {/* Quantity */}
                  <View
                    style={{ marginBottom: 12 }}
                    onLayout={handleFieldLayout("quantity")}
                  >
                    <Text
                      style={{
                        marginBottom: 8,
                        color: "#374151",
                        fontFamily: "Cairo-SemiBold",
                        textAlign: "right",
                      }}
                    >
                      الكمية *
                    </Text>
                    <TextInput
                      value={quantity}
                      onChangeText={(value) => {
                        setQuantity(value);
                        clearFieldError("quantity");
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
                        fieldErrors.quantity && {
                          borderColor: "#dc2626",
                          backgroundColor: "#fef2f2",
                        },
                      ]}
                    />
                    {!!fieldErrors.quantity && (
                      <Text
                        style={{
                          color: "#dc2626",
                          fontFamily: "Cairo-Regular",
                          textAlign: "right",
                          marginTop: 6,
                        }}
                      >
                        {fieldErrors.quantity}
                      </Text>
                    )}
                  </View>

                  {/* Unit */}
                  <View
                    style={{ marginBottom: 12 }}
                    onLayout={handleFieldLayout("unit")}
                  >
                    <Text
                      style={{
                        marginBottom: 8,
                        color: "#374151",
                        fontFamily: "Cairo-SemiBold",
                        textAlign: "right",
                      }}
                    >
                      الوحدة *
                    </Text>
                    <TextInput
                      value={unit}
                      onChangeText={(value) => {
                        setUnit(value);
                        clearFieldError("unit");
                      }}
                      placeholder="كجم"
                      placeholderTextColor="#9CA3AF"
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
                        fieldErrors.unit && {
                          borderColor: "#dc2626",
                          backgroundColor: "#fef2f2",
                        },
                      ]}
                    />
                    {!!fieldErrors.unit && (
                      <Text
                        style={{
                          color: "#dc2626",
                          fontFamily: "Cairo-Regular",
                          textAlign: "right",
                          marginTop: 6,
                        }}
                      >
                        {fieldErrors.unit}
                      </Text>
                    )}
                  </View>

                  {/* Harvest Date */}
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      style={{
                        marginBottom: 8,
                        color: "#374151",
                        fontFamily: "Cairo-SemiBold",
                        textAlign: "right",
                      }}
                    >
                      تاريخ الحصاد *
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        Platform.OS === "android"
                          ? openAndroidDatePicker("harvestDate")
                          : setShowDatePicker("harvestDate")
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
                        {formatDate(harvestDate)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Expiry Date */}
                  <View
                    style={{ marginBottom: 12 }}
                    onLayout={handleFieldLayout("expiryDate")}
                  >
                    <Text
                      style={{
                        marginBottom: 8,
                        color: "#374151",
                        fontFamily: "Cairo-SemiBold",
                        textAlign: "right",
                      }}
                    >
                      تاريخ انتهاء الصلاحية
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        Platform.OS === "android"
                          ? openAndroidDatePicker("expiryDate")
                          : setShowDatePicker("expiryDate")
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
                        fieldErrors.expiryDate && {
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
                        {expiryDate ? "تغيير" : "تحديد"}
                      </Text>
                      <Text
                        style={{
                          color: "#1f2937",
                          fontFamily: "Cairo-Regular",
                        }}
                      >
                        {formatDate(expiryDate)}
                      </Text>
                    </TouchableOpacity>
                    {expiryDate && (
                      <Pressable
                        onPress={() => {
                          setExpiryDate(null);
                          clearFieldError("expiryDate");
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
                          مسح التاريخ
                        </Text>
                      </Pressable>
                    )}
                    {!!fieldErrors.expiryDate && (
                      <Text
                        style={{
                          color: "#dc2626",
                          fontFamily: "Cairo-Regular",
                          textAlign: "right",
                          marginTop: 6,
                        }}
                      >
                        {fieldErrors.expiryDate}
                      </Text>
                    )}
                  </View>

                  {/* Quality Grade */}
                  <View
                    style={{ marginBottom: 12 }}
                    onLayout={handleFieldLayout("qualityGrade")}
                  >
                    <BottomSheetSelect
                      label="درجة الجودة"
                      placeholder="اختر درجة الجودة"
                      value={qualityGrade}
                      options={QUALITY_GRADE_OPTIONS}
                      onChange={(value) => {
                        setQualityGrade(value);
                        clearFieldError("qualityGrade");
                      }}
                      required
                      error={fieldErrors.qualityGrade}
                    />
                  </View>

                  <View
                    style={{ marginBottom: 12 }}
                    onLayout={handleFieldLayout("size")}
                  >
                    <BottomSheetSelect
                      label="الحجم"
                      placeholder="اختر الحجم"
                      value={size}
                      options={SIZE_OPTIONS}
                      onChange={(value) => {
                        setSize(value);
                        clearFieldError("size");
                      }}
                      required
                      error={fieldErrors.size}
                    />
                  </View>

                  <View
                    style={{ marginBottom: 12 }}
                    onLayout={handleFieldLayout("color")}
                  >
                    <BottomSheetSelect
                      label="اللون"
                      placeholder="اختر اللون"
                      value={color}
                      options={COLOR_OPTIONS}
                      onChange={(value) => {
                        setColor(value);
                        clearFieldError("color");
                      }}
                      searchable
                      required
                      error={fieldErrors.color}
                    />
                  </View>

                  <View
                    style={{ marginBottom: 12 }}
                    onLayout={handleFieldLayout("packingMethod")}
                  >
                    <BottomSheetSelect
                      label="طريقة التعبئة"
                      placeholder="اختر طريقة التعبئة"
                      value={packingMethod}
                      options={PACKING_METHOD_OPTIONS}
                      onChange={(value) => {
                        setPackingMethod(value);
                        clearFieldError("packingMethod");
                      }}
                      required
                      error={fieldErrors.packingMethod}
                    />
                  </View>

                  {/* Supply Scope */}
                  <View
                    style={{ marginBottom: 12 }}
                    onLayout={handleFieldLayout("supplyScope")}
                  >
                    <Text
                      style={{
                        marginBottom: 8,
                        color: "#374151",
                        fontFamily: "Cairo-SemiBold",
                        textAlign: "right",
                      }}
                    >
                      نطاق التوريد *
                    </Text>
                    <TextInput
                      value={supplyScope}
                      onChangeText={(value) => {
                        setSupplyScope(value);
                        clearFieldError("supplyScope");
                      }}
                      placeholder="مثال: محلي"
                      placeholderTextColor="#9CA3AF"
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
                        fieldErrors.supplyScope && {
                          borderColor: "#dc2626",
                          backgroundColor: "#fef2f2",
                        },
                      ]}
                    />
                    {!!fieldErrors.supplyScope && (
                      <Text
                        style={{
                          color: "#dc2626",
                          fontFamily: "Cairo-Regular",
                          textAlign: "right",
                          marginTop: 6,
                        }}
                      >
                        {fieldErrors.supplyScope}
                      </Text>
                    )}
                  </View>

                  {/* Image Upload */}
                  <View
                    style={{ marginBottom: 24 }}
                    onLayout={handleFieldLayout("imageUrls")}
                  >
                    <Text
                      style={{
                        marginBottom: 8,
                        color: "#374151",
                        fontFamily: "Cairo-SemiBold",
                        textAlign: "right",
                      }}
                    >
                      صور المحصول *
                    </Text>
                    <View
                      style={[
                        {
                          padding: 12,
                          backgroundColor: "white",
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: "#d1d5db",
                        },
                        fieldErrors.imageUrls && {
                          borderColor: "#dc2626",
                          backgroundColor: "#fef2f2",
                        },
                      ]}
                    >
                      <ImageUploader
                        maxImages={10}
                        autoUpload={true}
                        buttonLabel="اختر صور المحصول"
                        onImagesUploaded={(urls) => {
                          setImageUrls(urls);
                          clearFieldError("imageUrls");
                        }}
                      />
                    </View>
                    {!!fieldErrors.imageUrls && (
                      <Text
                        style={{
                          color: "#dc2626",
                          fontFamily: "Cairo-Regular",
                          textAlign: "right",
                          marginTop: 6,
                        }}
                      >
                        {fieldErrors.imageUrls}
                      </Text>
                    )}
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
                          جاري الإنشاء...
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
                        إضافة المحصول
                      </Text>
                    )}
                  </Pressable>
                </>
              ) : (
                <View
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    backgroundColor: "#f9fafb",
                    marginBottom: 24,
                  }}
                >
                  <Text
                    style={{
                      color: "#4b5563",
                      fontFamily: "Cairo-Regular",
                      textAlign: "right",
                    }}
                  >
                    يرجى اختيار المزرعة والمنتج لإدخال تفاصيل المحصول.
                  </Text>
                </View>
              )}

              {/* Date Pickers (iOS inline only) */}
              {Platform.OS === "ios" && showDatePicker === "harvestDate" && (
                <DateTimePicker
                  key="harvestDate"
                  value={harvestDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) =>
                    handleDateChange("harvestDate", event, date)
                  }
                />
              )}
              {Platform.OS === "ios" && showDatePicker === "expiryDate" && (
                <DateTimePicker
                  key="expiryDate"
                  value={expiryDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) =>
                    handleDateChange("expiryDate", event, date)
                  }
                />
              )}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
