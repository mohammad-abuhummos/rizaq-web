import { getProviderVehicles } from "@/services/transport";
import type { Vehicle } from "@/types/transport";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ProviderVehicle = Vehicle & { id?: number };

export default function VehiclesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [vehicles, setVehicles] = useState<ProviderVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProviderVehicles(Number(id));
      const vehiclesData = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      setVehicles(vehiclesData as ProviderVehicle[]);
    } catch (err) {
      console.error("Error loading vehicles:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVehicles();
    setRefreshing(false);
  };

  if (loading) return <ActivityIndicator className="mt-10" size="large" />;

  return (
    <View className="flex-1 bg-white p-4">
      <View className="flex-row justify-between mb-4">
        <Text className="text-xl font-bold">🚗 Vehicles</Text>
        <Button
          title="Add Vehicle"
          onPress={() => router.push(`/transport/${id}/vehicles/create`)}
        />
      </View>

      {vehicles.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">No vehicles registered yet.</Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item, index) =>
            (item.id ?? item.vehicleId ?? index).toString()
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              className="border border-gray-200 p-4 mb-3 rounded-lg bg-gray-50"
              onPress={() =>
                router.push(`/transport/${id}/vehicles/${item.id}`)
              }
            >
              <Text className="font-semibold text-lg">{item.vehicleType}</Text>
              <Text>Model: {item.model}</Text>
              <Text>Capacity: {item.capacity}</Text>
              <Text>Price per Km: {item.pricePerKm}</Text>
              <Text>Workers Available: {item.workersAvailable}</Text>
              <Text>Availability: {item.availabilityHours}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// export default function VehiclesPlaceholder() {
//   return <View />;
// }