import { useTransport } from "@/hooks/useTransport";
import { getTransportProviders } from "@/services/transport";
import { useRouter } from "expo-router";
import {
  Clock,
  CreditCard,
  DollarSign,
  MapPin,
  Phone,
  Plus,
  Truck,
  User,
} from "lucide-react-native";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function TransportListScreen() {
  const { loading, data, fetchData } = useTransport();
  const router = useRouter();

  const providers = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : [];

  useEffect(() => {
    fetchData(() => getTransportProviders());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading)
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="text-gray-600 mt-3">جاري تحميل مزودي النقل...</Text>
      </View>
    );

  if (!providers || providers.length === 0)
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-500 text-lg">لا يوجد مزودي نقل حالياً</Text>

        {/* ✅ الزر العائم */}
        <TouchableOpacity
          onPress={() => router.push("/transport/create")}
          className="absolute bottom-10 right-6 bg-green-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        >
          <Plus size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 text-center">
          مزودي النقل
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {providers.map((item: any) => (
          <TouchableOpacity
            key={item.transportProviderId}
            onPress={() => router.push(`/transport/${item.transportProviderId}`)}
            className="mx-4 my-3 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
          >
            {/* Header section with name + icon */}
            <View className="flex-row items-center mb-4">
              <View className="bg-green-600 p-3 rounded-full">
                <Truck size={22} color="#fff" />
              </View>
              <View className="mr-3 flex-1">
                <Text className="text-lg font-bold text-gray-900 text-right">
                  {item.user?.fullName || "اسم غير معروف"}
                </Text>
                <Text className="text-sm text-gray-500 text-right">
                  رقم المعرف: {item.transportProviderId}
                </Text>
              </View>
            </View>

            {/* Details */}
            <DetailItem
              label="نوع الحساب"
              value={item.accountType || "غير محدد"}
            />
            <DetailItem
              label="المحفظة / الحساب"
              value={item.walletAccount || "غير محدد"}
              icon={<CreditCard size={18} color="#16a34a" />}
            />
            <DetailItem
              label="المناطق المغطاة"
              value={item.coveredAreas || "غير محدد"}
              icon={<MapPin size={18} color="#16a34a" />}
            />
            <DetailItem
              label="عدد العمال المتاحين"
              value={`${item.workersAvailable || 0}`}
              icon={<User size={18} color="#16a34a" />}
            />
            <DetailItem
              label="ساعات العمل"
              value={item.availabilityHours || "غير محدد"}
              icon={<Clock size={18} color="#16a34a" />}
            />
            <DetailItem
              label="السعر التقديري / كم"
              value={`${item.estimatedPricePerKm || 0} درهم`}
              icon={<DollarSign size={18} color="#16a34a" />}
            />
            <DetailItem
              label="رقم الهاتف"
              value={item.user?.phone || "غير متوفر"}
              icon={<Phone size={18} color="#16a34a" />}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ✅ الزر العائم */}
      <TouchableOpacity
        onPress={() => router.push("/transport/create")}
        className="absolute bottom-8 right-6 bg-green-600 w-16 h-16 rounded-full items-center justify-center shadow-lg"
      >
        <Plus size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// export default function TransportIndexPlaceholder() {
//   return <View />;
// }

// // ✅ DetailItem component
function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string;
  icon?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-gray-100 py-2">
      <View className="flex-row items-center">
        {icon && <View className="ml-2">{icon}</View>}
        <Text className="text-gray-800 text-right ml-2">{value}</Text>
      </View>
      <Text className="text-green-700 font-semibold text-right">{label}</Text>
    </View>
  );
}
