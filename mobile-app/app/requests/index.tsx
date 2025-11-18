import { getTransportProviders } from "@/services/transport";
import { useRouter } from "expo-router";
import {
  CheckCircle,
  Clock,
  MapPin,
  Settings,
  Truck,
  User,
  XCircle
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function TransportProvidersListScreen() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getTransportProviders();
        const data = res?.data || res || [];
        setProviders(data);
      } catch (err) {
        console.error("🚨 Failed to load transport providers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="mt-2 text-gray-600">جاري تحميل بيانات مزودي النقل...</Text>
      </View>
    );

  if (!providers || providers.length === 0)
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-500 text-lg">لا يوجد مزودي نقل حالياً</Text>
        <TouchableOpacity
          onPress={() => router.push("/requests/create")}
          className="mt-6 bg-green-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold text-lg">➕ إنشاء طلب جديد</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 text-center">
          🚚 مزودي النقل
        </Text>
      </View>

      {/* Scroll Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {providers.map((provider, index) => (
          <View
            key={index}
            className="mx-4 my-3 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
          >
            {/* Provider Header */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="bg-green-600 p-3 rounded-full">
                  <Truck size={22} color="#fff" />
                </View>
                <Text className="text-lg font-bold text-gray-900 mr-3">
                  مزود رقم #{provider.transportProviderId}
                </Text>
              </View>
              <View className="flex-row items-center">
                {provider.isVerified ? (
                  <CheckCircle size={18} color="#16a34a" />
                ) : (
                  <XCircle size={18} color="#ef4444" />
                )}
                <Text
                  className={`ml-1 font-semibold ${provider.isVerified ? "text-green-700" : "text-red-600"
                    }`}
                >
                  {provider.isVerified ? "موثّق" : "غير موثّق"}
                </Text>
              </View>
            </View>

            {/* User Info */}
            <View className="border-t border-gray-100 pt-3">
              <View className="flex-row items-center mb-1">
                <User size={16} color="#16a34a" />
                <Text className="text-gray-700 ml-2">
                  <Text className="font-semibold">الاسم:</Text>{" "}
                  {provider.user?.fullName || "—"}
                </Text>
              </View>
              <View className="flex-row items-center mb-1">
                <MapPin size={16} color="#16a34a" />
                <Text className="text-gray-700 ml-2">
                  <Text className="font-semibold">البريد:</Text>{" "}
                  {provider.user?.email || "—"}
                </Text>
              </View>
              <View className="flex-row items-center mb-1">
                <Clock size={16} color="#16a34a" />
                <Text className="text-gray-700 ml-2">
                  <Text className="font-semibold">ساعات العمل:</Text>{" "}
                  {provider.availabilityHours || "غير محددة"}
                </Text>
              </View>
              <View className="flex-row items-center mb-1">
                <Settings size={16} color="#16a34a" />
                <Text className="text-gray-700 ml-2">
                  <Text className="font-semibold">نوع الحساب:</Text>{" "}
                  {provider.accountType || "—"}
                </Text>
              </View>
              <Text className="text-gray-700 mt-1">
                <Text className="font-semibold">عدد العمال:</Text>{" "}
                {provider.workersAvailable ?? 0}
              </Text>
            </View>

            {/* Vehicles Section */}
            {provider.vehicles && provider.vehicles.length > 0 && (
              <View className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-3">
                <Text className="text-lg font-bold text-gray-800 mb-2 text-center">
                  🚗 المركبات ({provider.vehicles.length})
                </Text>

                {provider.vehicles.map((vehicle: any, vIndex: number) => (
                  <View
                    key={vIndex}
                    className="bg-white border border-gray-200 rounded-xl p-3 mb-2"
                  >
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-green-700 font-bold">
                        رقم المركبة #{vehicle.transportVehicleId}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        {new Date(vehicle.createdAt).toLocaleDateString("ar-EG")}
                      </Text>
                    </View>

                    <DetailRow label="النوع" value={vehicle.vehicleType} />
                    <DetailRow label="الموديل" value={vehicle.model} />
                    <DetailRow label="القدرة" value={vehicle.capacity} />
                    <DetailRow
                      label="سعر الكيلومتر"
                      value={`${vehicle.pricePerKm} درهم`}
                    />
                    <DetailRow
                      label="ساعات العمل"
                      value={vehicle.availabilityHours}
                    />
                    <DetailRow
                      label="عدد العمال"
                      value={vehicle.workersAvailable}
                    />
                    <DetailRow
                      label="أدوات التحميل"
                      value={vehicle.hasTools ? "نعم" : "لا"}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* ✅ Floating Action Button */}
      <TouchableOpacity
        onPress={() => router.push("/requests/create")}
        className="absolute bottom-6 right-6 bg-green-600 w-16 h-16 rounded-full items-center justify-center shadow-lg"
      >
        <Text className="text-white text-3xl font-bold">+</Text>
      </TouchableOpacity>
    </View>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-gray-100 py-1">
      <Text className="text-gray-600 font-semibold">{label}</Text>
      <Text className="text-gray-800">{String(value || "—")}</Text>
    </View>
  );
}
