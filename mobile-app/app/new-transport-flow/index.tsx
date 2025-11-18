import { BottomSheetSelect } from "@/components/ui/bottom-sheet-select";
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Clock,
    MapPin,
    Phone,
    Truck,
    Users,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import {
    createTransportRequest,
    getTransportProviders,
    getTransportRegions,
} from "@/services/transport";
import type { TransportProvider } from "@/types/transport";

type SearchParams = {
    conversationId?: string;
    contextType?: string;
    contextId?: string;
};

const formatDateForDisplay = (value: Date | null) => {
    if (!value) return "حدّد تاريخاً";
    try {
        return value.toLocaleString("ar-EG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return value.toISOString();
    }
};

const toIsoString = (value: Date | null) => (value ? value.toISOString() : new Date().toISOString());

export default function NewTransportFlowScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<SearchParams>();
    const { user } = useAuth();

    const [providers, setProviders] = useState<TransportProvider[]>([]);
    const [regions, setRegions] = useState<string[]>([]);
    const [providersLoading, setProvidersLoading] = useState(false);
    const [regionsLoading, setRegionsLoading] = useState(false);
    const [providersError, setProvidersError] = useState<string | null>(null);
    const [regionsError, setRegionsError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedProviders, setExpandedProviders] = useState<Record<number, boolean>>({});

    const [pickupDate, setPickupDate] = useState<Date | null>(null);
    const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);
    const [showPickupPicker, setShowPickupPicker] = useState(false);
    const [showDeliveryPicker, setShowDeliveryPicker] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const defaultBuyerId = useMemo(() => (user?.id ? String(user.id) : ""), [user?.id]);
    const defaultOrderId = useMemo(() => {
        const raw = params.contextId ?? "";
        return Number.isFinite(Number(raw)) ? String(raw) : "";
    }, [params.contextId]);

    const [form, setForm] = useState({
        orderId: defaultOrderId,
        orderType: params.contextType ?? "",
        buyerUserId: defaultBuyerId,
        fromRegion: "",
        toRegion: "",
        distanceKm: "",
        productType: "",
        weightKg: "",
        specialRequirements: "",
    });

    useEffect(() => {
        setForm(prev => ({
            ...prev,
            orderId: prev.orderId || defaultOrderId,
            orderType: prev.orderType || params.contextType || "",
            buyerUserId: prev.buyerUserId || defaultBuyerId,
        }));
    }, [defaultBuyerId, defaultOrderId, params.contextType]);

    const parseProvidersResponse = (payload: any): TransportProvider[] => {
        if (!payload) return [];
        if (Array.isArray(payload)) return payload as TransportProvider[];
        if (Array.isArray(payload?.data)) return payload.data as TransportProvider[];
        return [];
    };

    const parseRegionsResponse = (payload: any): string[] => {
        if (!payload) return [];
        if (Array.isArray(payload)) return payload as string[];
        if (Array.isArray(payload?.data)) return payload.data as string[];
        return [];
    };

    const fetchProviders = useCallback(async () => {
        setProvidersLoading(true);
        setProvidersError(null);
        try {
            const res = await getTransportProviders();
            const list = parseProvidersResponse(res?.data ?? res);
            setProviders(list);
        } catch (error: any) {
            console.error("Failed to load transport providers", error);
            const message = error?.message ?? "تعذر تحميل مزودي النقل";
            setProvidersError(message);
        } finally {
            setProvidersLoading(false);
        }
    }, []);

    const fetchRegions = useCallback(async () => {
        setRegionsLoading(true);
        setRegionsError(null);
        try {
            const res = await getTransportRegions();
            const list = parseRegionsResponse(res?.data ?? res);
            setRegions(list);
        } catch (error: any) {
            console.error("Failed to load transport regions", error);
            const message = error?.message ?? "تعذر تحميل المناطق";
            setRegionsError(message);
        } finally {
            setRegionsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProviders();
        fetchRegions();
    }, [fetchProviders, fetchRegions]);

    const toggleProvider = useCallback((providerId: number) => {
        setExpandedProviders(prev => ({
            ...prev,
            [providerId]: !prev[providerId],
        }));
    }, []);

    const onAndroidDatePick = useCallback(
        (field: "pickup" | "delivery") => {
            const currentValue = field === "pickup" ? pickupDate ?? new Date() : deliveryDate ?? pickupDate ?? new Date();
            const applyDate = (value: Date) => {
                if (field === "pickup") {
                    setPickupDate(value);
                } else {
                    setDeliveryDate(value);
                }
            };

            DateTimePickerAndroid.open({
                value: currentValue,
                mode: "date",
                is24Hour: true,
                onChange: (event, selectedDate) => {
                    if (event.type !== "set" || !selectedDate) return;
                    const baseDate = new Date(selectedDate);

                    DateTimePickerAndroid.open({
                        value: currentValue,
                        mode: "time",
                        is24Hour: true,
                        onChange: (timeEvent, timeValue) => {
                            if (timeEvent.type !== "set" || !timeValue) {
                                applyDate(baseDate);
                                return;
                            }

                            const finalDate = new Date(baseDate);
                            finalDate.setHours(timeValue.getHours(), timeValue.getMinutes(), timeValue.getSeconds(), 0);
                            applyDate(finalDate);
                        },
                    });
                },
            });
        },
        [deliveryDate, pickupDate]
    );

    const onIosDatePick = useCallback(
        (field: "pickup" | "delivery", event: DateTimePickerEvent, selectedDate?: Date) => {
            if (event.type === "set" && selectedDate) {
                if (field === "pickup") {
                    setPickupDate(selectedDate);
                } else {
                    setDeliveryDate(selectedDate);
                }
            }

            if (event.type === "set" || event.type === "dismissed") {
                if (field === "pickup") {
                    setShowPickupPicker(false);
                } else {
                    setShowDeliveryPicker(false);
                }
            }
        },
        []
    );

    const openPickupPicker = useCallback(() => {
        if (Platform.OS === "android") {
            onAndroidDatePick("pickup");
        } else {
            setShowDeliveryPicker(false);
            setShowPickupPicker(true);
        }
    }, [onAndroidDatePick]);

    const openDeliveryPicker = useCallback(() => {
        if (Platform.OS === "android") {
            onAndroidDatePick("delivery");
        } else {
            setShowPickupPicker(false);
            setShowDeliveryPicker(true);
        }
    }, [onAndroidDatePick]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.allSettled([fetchProviders(), fetchRegions()]);
        } finally {
            setRefreshing(false);
        }
    }, [fetchProviders, fetchRegions]);

    const handleSubmit = useCallback(async () => {
        if (!form.fromRegion || !form.toRegion) {
            Alert.alert("تنبيه", "يرجى اختيار منطقتي التحميل والتسليم");
            return;
        }

        if (!form.orderType) {
            Alert.alert("تنبيه", "يرجى تحديد نوع الطلب");
            return;
        }

        setSubmitting(true);
        try {
            await createTransportRequest({
                orderId: Number(form.orderId) || 0,
                orderType: form.orderType,
                buyerUserId: Number(form.buyerUserId) || 0,
                fromRegion: form.fromRegion,
                toRegion: form.toRegion,
                distanceKm: Number(form.distanceKm) || 0,
                productType: form.productType,
                weightKg: Number(form.weightKg) || 0,
                preferredPickupDate: toIsoString(pickupDate),
                preferredDeliveryDate: toIsoString(deliveryDate ?? pickupDate),
                specialRequirements: form.specialRequirements,
            });

            Alert.alert("تم الإرسال", "تم إنشاء طلب النقل بنجاح", [
                {
                    text: "رجوع للمحادثة",
                    onPress: () => router.back(),
                },
                { text: "حسناً" },
            ]);
        } catch (error: any) {
            console.error("Failed to create transport request", error);
            const message = error?.message ?? "فشل في إنشاء طلب النقل";
            Alert.alert("خطأ", message);
        } finally {
            setSubmitting(false);
        }
    }, [deliveryDate, form, pickupDate, router]);

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                keyboardShouldPersistTaps="handled"
            >
                <View className="mb-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="self-start mb-3 px-3 py-1 rounded-full bg-white border border-gray-200"
                    >
                        <Text className="text-gray-600">⬅︎ عودة</Text>
                    </TouchableOpacity>

                    <View className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                        <Text className="text-2xl font-bold text-gray-900 mb-2 text-right">
                            إدارة طلب النقل
                        </Text>
                        <Text className="text-sm text-gray-500 mb-3 text-right">
                            رقم المحادثة #{params.conversationId ?? "—"}
                        </Text>

                        <View className="border-t border-gray-100 pt-3 mt-3">
                            <Text className="text-sm text-gray-600 text-right">
                                نوع السياق: <Text className="font-semibold text-gray-800">{params.contextType ?? "—"}</Text>
                            </Text>
                            <Text className="text-sm text-gray-600 text-right mt-1">
                                معرف السياق: <Text className="font-semibold text-gray-800">{params.contextId ?? "—"}</Text>
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="mb-6">
                    <Text className="text-xl font-bold text-gray-900 mb-3 text-right">
                        مزودو النقل المتاحون
                    </Text>

                    {providersError && (
                        <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                            <Text className="text-red-700 text-right">{providersError}</Text>
                        </View>
                    )}

                    {providersLoading && providers.length === 0 ? (
                        <View className="bg-white border border-gray-200 rounded-2xl p-6 items-center justify-center">
                            <ActivityIndicator size="large" color="#16a34a" />
                            <Text className="text-gray-600 mt-3">جاري تحميل قائمة المزودين...</Text>
                        </View>
                    ) : providers.length === 0 ? (
                        <View className="bg-white border border-dashed border-gray-300 rounded-2xl p-6 items-center">
                            <Text className="text-gray-600 text-center">
                                لا يوجد مزودو نقل متاحون حالياً.
                            </Text>
                        </View>
                    ) : (
                        providers.map((provider, index) => {
                            const providerId = provider.transportProviderId ?? provider.userId ?? index;
                            const expanded = !!expandedProviders[providerId];
                            return (
                                <View
                                    key={`${providerId}-${index}`}
                                    className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm"
                                >
                                    <View className="flex-row justify-between items-center mb-3">
                                        <View className="flex-1 mr-3">
                                            <Text className="text-lg font-bold text-gray-900 text-right">
                                                {provider.user?.fullName || "مزود مجهول"}
                                            </Text>
                                            <Text className="text-xs text-gray-500 text-right">
                                                معرف المزود: {providerId || "—"}
                                            </Text>
                                        </View>
                                        <View className="bg-green-100 px-3 py-1 rounded-full">
                                            <Text className="text-green-700 text-xs font-semibold">{provider.accountType || "—"}</Text>
                                        </View>
                                    </View>

                                    <View className="border border-gray-100 rounded-xl p-3 mb-3 bg-gray-50">
                                        <View className="flex-row items-center justify-between mb-2">
                                            <View className="flex-row items-center">
                                                <Truck size={18} color="#16a34a" />
                                                <Text className="text-gray-700 mr-2">السعر المقدر / كم</Text>
                                            </View>
                                            <Text className="text-gray-900 font-semibold">
                                                {provider.estimatedPricePerKm ?? 0} درهم
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center justify-between mb-2">
                                            <View className="flex-row items-center">
                                                <MapPin size={18} color="#16a34a" />
                                                <Text className="text-gray-700 mr-2">المناطق</Text>
                                            </View>
                                            <Text className="text-gray-900 font-semibold text-right" style={{ flex: 1 }}>
                                                {provider.coveredAreas || "—"}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center justify-between mb-2">
                                            <View className="flex-row items-center">
                                                <Clock size={18} color="#16a34a" />
                                                <Text className="text-gray-700 mr-2">ساعات العمل</Text>
                                            </View>
                                            <Text className="text-gray-900 font-semibold">
                                                {provider.availabilityHours || "—"}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center justify-between">
                                            <View className="flex-row items-center">
                                                <Users size={18} color="#16a34a" />
                                                <Text className="text-gray-700 mr-2">عدد العمال</Text>
                                            </View>
                                            <Text className="text-gray-900 font-semibold">
                                                {provider.workersAvailable ?? 0}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-row items-center">
                                            <Phone size={18} color="#16a34a" />
                                            <Text className="text-gray-700 mr-2">
                                                {provider.user?.phone || "—"}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => toggleProvider(providerId)}
                                            className="px-3 py-1 rounded-full border border-gray-200"
                                        >
                                            <Text className="text-gray-600 text-sm">
                                                {expanded ? "إخفاء المركبات" : "عرض المركبات"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {expanded && provider.vehicles && provider.vehicles.length > 0 && (
                                        <View className="mt-3 border-t border-dashed border-gray-200 pt-3">
                                            {provider.vehicles.map((vehicle, vehicleIndex) => (
                                                <View
                                                    key={`${vehicle.transportVehicleId ?? vehicle.vehicleId ?? vehicleIndex}`}
                                                    className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-2"
                                                >
                                                    <Text className="text-green-700 font-semibold mb-2">
                                                        مركبة #{vehicle.transportVehicleId ?? "—"}
                                                    </Text>
                                                    <Text className="text-gray-700 mb-1">
                                                        النوع: <Text className="font-semibold">{vehicle.vehicleType || "—"}</Text>
                                                    </Text>
                                                    <Text className="text-gray-700 mb-1">
                                                        القدرة: <Text className="font-semibold">{vehicle.capacity || "—"}</Text>
                                                    </Text>
                                                    <Text className="text-gray-700 mb-1">
                                                        السعر/كم: <Text className="font-semibold">{vehicle.pricePerKm ?? 0} درهم</Text>
                                                    </Text>
                                                    <Text className="text-gray-700 mb-1">
                                                        العمال: <Text className="font-semibold">{vehicle.workersAvailable ?? 0}</Text>
                                                    </Text>
                                                    <Text className="text-gray-700">
                                                        أدوات تحميل: <Text className="font-semibold">{vehicle.hasTools ? "نعم" : "لا"}</Text>
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}
                </View>

                <View className="mb-6">
                    <Text className="text-xl font-bold text-gray-900 mb-4 text-right">
                        إنشاء طلب نقل جديد
                    </Text>

                    {regionsError && (
                        <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-3">
                            <Text className="text-yellow-700 text-right">{regionsError}</Text>
                        </View>
                    )}

                    <View className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                        <Text className="text-gray-800 text-right mb-2">بيانات الطلب</Text>
                        <View className="flex-col gap-3">
                            <TextInput
                                placeholder="رقم الطلب"
                                keyboardType="numeric"
                                value={form.orderId}
                                onChangeText={value => setForm(prev => ({ ...prev, orderId: value }))}
                                className="border border-gray-300 rounded-lg p-3 text-right"
                            />

                            <TextInput
                                placeholder="نوع الطلب"
                                value={form.orderType}
                                onChangeText={value => setForm(prev => ({ ...prev, orderType: value }))}
                                className="border border-gray-300 rounded-lg p-3 text-right"
                            />

                            <TextInput
                                placeholder="معرف المشتري"
                                keyboardType="numeric"
                                value={form.buyerUserId}
                                onChangeText={value => setForm(prev => ({ ...prev, buyerUserId: value }))}
                                className="border border-gray-300 rounded-lg p-3 text-right"
                            />

                            <BottomSheetSelect
                                label="منطقة التحميل"
                                placeholder={regionsLoading ? "جاري التحميل..." : "اختر منطقة"}
                                value={form.fromRegion}
                                options={regions.map(region => ({ label: region, value: region }))}
                                onChange={value => setForm(prev => ({ ...prev, fromRegion: value }))}
                                disabled={regionsLoading}
                                searchable
                                required
                            />

                            <BottomSheetSelect
                                label="منطقة التسليم"
                                placeholder={regionsLoading ? "جاري التحميل..." : "اختر منطقة"}
                                value={form.toRegion}
                                options={regions.map(region => ({ label: region, value: region }))}
                                onChange={value => setForm(prev => ({ ...prev, toRegion: value }))}
                                disabled={regionsLoading}
                                searchable
                                required
                            />

                            <TextInput
                                placeholder="المسافة (كم)"
                                keyboardType="numeric"
                                value={form.distanceKm}
                                onChangeText={value => setForm(prev => ({ ...prev, distanceKm: value }))}
                                className="border border-gray-300 rounded-lg p-3 text-right"
                            />

                            <TextInput
                                placeholder="نوع المنتج"
                                value={form.productType}
                                onChangeText={value => setForm(prev => ({ ...prev, productType: value }))}
                                className="border border-gray-300 rounded-lg p-3 text-right"
                            />

                            <TextInput
                                placeholder="الوزن (كجم)"
                                keyboardType="numeric"
                                value={form.weightKg}
                                onChangeText={value => setForm(prev => ({ ...prev, weightKg: value }))}
                                className="border border-gray-300 rounded-lg p-3 text-right"
                            />

                            <View>
                                <Text className="text-gray-600 mb-2 text-right">تاريخ التحميل المفضل</Text>
                                <TouchableOpacity
                                    onPress={openPickupPicker}
                                    className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                                >
                                    <Text className="text-gray-800 text-right">{formatDateForDisplay(pickupDate)}</Text>
                                </TouchableOpacity>
                                {Platform.OS === "ios" && showPickupPicker && (
                                    <DateTimePicker
                                        value={pickupDate ?? new Date()}
                                        mode="datetime"
                                        display="default"
                                        onChange={(event, date) => onIosDatePick("pickup", event, date ?? undefined)}
                                    />
                                )}
                            </View>

                            <View>
                                <Text className="text-gray-600 mb-2 text-right">تاريخ التسليم المفضل</Text>
                                <TouchableOpacity
                                    onPress={openDeliveryPicker}
                                    className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                                >
                                    <Text className="text-gray-800 text-right">{formatDateForDisplay(deliveryDate)}</Text>
                                </TouchableOpacity>
                                {Platform.OS === "ios" && showDeliveryPicker && (
                                    <DateTimePicker
                                        value={deliveryDate ?? pickupDate ?? new Date()}
                                        mode="datetime"
                                        display="default"
                                        onChange={(event, date) => onIosDatePick("delivery", event, date ?? undefined)}
                                    />
                                )}
                            </View>

                            <TextInput
                                placeholder="متطلبات خاصة"
                                value={form.specialRequirements}
                                onChangeText={value => setForm(prev => ({ ...prev, specialRequirements: value }))}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                className="border border-gray-300 rounded-lg p-3 text-right"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={submitting}
                            className={`mt-5 py-3 rounded-xl ${submitting ? "bg-gray-400" : "bg-green-600"}`}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-center text-white text-lg font-bold">إرسال طلب النقل</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

