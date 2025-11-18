import { useAuth } from "@/context/AuthContext";
import { addVehicleToProvider } from "@/services/transport";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CreateVehicleScreen() {
  const { id } = useLocalSearchParams(); // providerId
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    vehicleType: "",
    capacity: "",
    model: "",
    vehicleLicensePath: "",
    vehicleOwnershipProofPath: "",
    driverLicensesPaths: [""],
    storageType: "",
    hasTools: false,
    workersAvailable: "",
    pricePerKm: "",
    availabilityHours: "",
    canProvideLoadingWorkers: false,
  });

  const handleSubmit = async () => {
    if (!id) {
      Alert.alert("خطأ", "معرّف المزود غير موجود");
      return;
    }

    if (!user) {
      Alert.alert("خطأ", "المستخدم غير مسجل الدخول");
      return;
    }

    if (!form.vehicleType || !form.model) {
      Alert.alert("تنبيه", "يرجى ملء نوع المركبة والموديل على الأقل");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        providerId: Number(id),
        vehicleType: form.vehicleType,
        capacity: form.capacity,
        model: form.model,
        vehicleLicensePath: form.vehicleLicensePath,
        vehicleOwnershipProofPath: form.vehicleOwnershipProofPath,
        driverLicensesPaths: form.driverLicensesPaths.filter(Boolean),
        storageType: form.storageType,
        hasTools: form.hasTools,
        workersAvailable: Number(form.workersAvailable) || 0,
        pricePerKm: Number(form.pricePerKm) || 0,
        availabilityHours: form.availabilityHours,
        canProvideLoadingWorkers: form.canProvideLoadingWorkers,
      };

      const result = await addVehicleToProvider(Number(id), payload);
      if (result) {
        Alert.alert("تم بنجاح", "تمت إضافة المركبة بنجاح ✅");
        router.push(`/transport/${id}`);
      } else {
        Alert.alert("خطأ", "تعذر إضافة المركبة، حاول لاحقًا");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("خطأ", "حدث خطأ أثناء الإرسال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 text-center">
          إضافة مركبة جديدة
        </Text>
      </View>

      {/* Form */}
      <View className="p-4">
        <FormInput
          label="نوع المركبة"
          value={form.vehicleType}
          onChangeText={(v) => setForm({ ...form, vehicleType: v })}
        />
        <FormInput
          label="السعة"
          value={form.capacity}
          onChangeText={(v) => setForm({ ...form, capacity: v })}
        />
        <FormInput
          label="الموديل"
          value={form.model}
          onChangeText={(v) => setForm({ ...form, model: v })}
        />
        <FormInput
          label="نوع التخزين"
          value={form.storageType}
          onChangeText={(v) => setForm({ ...form, storageType: v })}
        />
        <FormInput
          label="عدد العمال المتاحين"
          value={form.workersAvailable}
          keyboardType="numeric"
          onChangeText={(v) => setForm({ ...form, workersAvailable: v })}
        />
        <FormInput
          label="السعر لكل كم"
          value={form.pricePerKm}
          keyboardType="numeric"
          onChangeText={(v) => setForm({ ...form, pricePerKm: v })}
        />
        <FormInput
          label="ساعات العمل"
          value={form.availabilityHours}
          onChangeText={(v) => setForm({ ...form, availabilityHours: v })}
        />

        {/* Boolean options */}
        <TouchableOpacity
          className={`mt-3 py-3 rounded-lg border ${form.hasTools ? "bg-green-100 border-green-500" : "bg-white border-gray-300"
            }`}
          onPress={() => setForm({ ...form, hasTools: !form.hasTools })}
        >
          <Text className="text-center text-gray-800 font-semibold">
            {form.hasTools ? "✅ لديه أدوات تحميل" : "❌ لا توجد أدوات تحميل"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`mt-3 py-3 rounded-lg border ${form.canProvideLoadingWorkers
            ? "bg-green-100 border-green-500"
            : "bg-white border-gray-300"
            }`}
          onPress={() =>
            setForm({
              ...form,
              canProvideLoadingWorkers: !form.canProvideLoadingWorkers,
            })
          }
        >
          <Text className="text-center text-gray-800 font-semibold">
            {form.canProvideLoadingWorkers
              ? "✅ يوفر عمال تحميل"
              : "❌ لا يوفر عمال تحميل"}
          </Text>
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity
          disabled={loading}
          onPress={handleSubmit}
          className={`mt-6 py-4 rounded-lg ${loading ? "bg-gray-400" : "bg-green-600"
            }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-lg font-bold text-center">
              حفظ المركبة
            </Text>
          )}
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-3 py-3 bg-gray-200 rounded-lg"
        >
          <Text className="text-center text-gray-700 font-semibold">
            إلغاء
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// export default function CreateVehiclePlaceholder() {
//   return <View />;
// }

function FormInput({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value?: string;
  onChangeText: (v: string) => void;
  keyboardType?: "numeric" | "default";
}) {
  return (
    <View className="mb-3">
      <Text className="text-gray-700 mb-1 font-semibold text-right">{label}</Text>
      <TextInput
        className="border border-gray-300 bg-white rounded-lg p-3 text-right"
        value={value}
        onChangeText={onChangeText}
        placeholder={`أدخل ${label}`}
        keyboardType={keyboardType}
      />
    </View>
  );
}
