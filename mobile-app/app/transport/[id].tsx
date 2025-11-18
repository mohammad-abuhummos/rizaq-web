import { getProviderVehicles } from "@/services/transport";
import type { Vehicle } from "@/types/transport";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus, Truck } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ProviderVehicle = Vehicle & { id?: number; user?: any };

export default function TransportDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<ProviderVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await getProviderVehicles(Number(id));
        const vehiclesData = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : [];
        setVehicles(vehiclesData as ProviderVehicle[]);
      } catch (err) {
        console.error("Failed to fetch vehicles:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, [id]);

  if (loading)
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="mt-2 text-gray-600">جاري تحميل المركبات...</Text>
      </View>
    );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-gray-900">مركبات المزود</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {vehicles.length === 0 ? (
          <View className="flex-1 items-center justify-center py-10">
            <Text className="text-gray-500 text-lg">لا يوجد مركبات بعد</Text>
          </View>
        ) : (
          <FlatList
            data={vehicles}
            keyExtractor={(item, index) =>
              (item.id ?? item.vehicleId ?? index).toString()
            }
            renderItem={({ item }) => (
              <View className="mx-4 my-3 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <View className="flex-row items-center mb-3">
                  <View className="bg-green-600 p-3 rounded-full">
                    <Truck size={22} color="#fff" />
                  </View>
                  <Text className="text-lg font-bold text-gray-900 mr-3 flex-1 text-right">
                    {item.vehicleType || "نوع غير معروف"}
                  </Text>
                </View>

                <View className="border-t border-gray-100 pt-2">
                  <Text className="text-gray-700 text-right">
                    <Text className="font-semibold text-green-700">الموديل:</Text>{" "}
                    {item.model || "غير محدد"}
                  </Text>
                  <Text className="text-gray-700 text-right mt-1">
                    <Text className="font-semibold text-green-700">السعة:</Text>{" "}
                    {item.capacity || "غير محددة"}
                  </Text>
                  <Text className="text-gray-700 text-right mt-1">
                    <Text className="font-semibold text-green-700">
                      السعر لكل كم:
                    </Text>{" "}
                    {item.pricePerKm || 0} درهم
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </ScrollView>

      {/* ✅ الزر العائم لإضافة مركبة جديدة */}
      <TouchableOpacity
        onPress={() => router.push(`/transport/${id}/create-vehicle`)}
        className="absolute bottom-8 right-6 bg-green-600 w-16 h-16 rounded-full items-center justify-center shadow-lg"
      >
        <Plus size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// export default function TransportDetailPlaceholder() {
//   return <View />;
// }