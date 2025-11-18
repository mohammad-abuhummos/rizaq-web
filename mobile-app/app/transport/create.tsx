import { useAuth } from "@/context/AuthContext";
import { createTransportProvider } from "@/services/transport";
import type { CreateTransportProviderDto } from "@/types/transport";
import { useRouter } from "expo-router";
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

export default function CreateTransportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    accountType: "",
    walletAccount: "",
    coveredAreas: "",
    workersAvailable: "",
    availabilityHours: "",
    preferredPaymentMethod: "",
    estimatedPricePerKm: "",
  });

  const handleSubmit = async () => {
    const userId = user?.id ? Number(user.id) : NaN;

    if (!userId || Number.isNaN(userId)) {
      Alert.alert("خطأ", "المستخدم غير مسجل الدخول");
      return;
    }

    if (!form.accountType || !form.coveredAreas) {
      Alert.alert("تنبيه", "يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload: CreateTransportProviderDto = {
        ...form,
        userId,
        workersAvailable: Number(form.workersAvailable) || 0,
        estimatedPricePerKm: Number(form.estimatedPricePerKm) || 0,
        businessLicensePath: "",
        drivingLicensePath: "",
        bankAccountNumber: "",
        iban: "",
        cardNumber: "",
        vehicleImages: [],
      };

      await createTransportProvider(payload);
      Alert.alert("تم بنجاح", "تم إنشاء مزود النقل بنجاح ✅");
      router.push("/transport");
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء إنشاء مزود النقل");
      Alert.alert("خطأ", "فشل في إنشاء مزود النقل ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View className="flex-1 justify-center items-center p-4 bg-white">
        <View className="w-full max-w-sm">

          {/* رأس الصفحة */}
          <View className="items-center mb-8">

            <Text className="text-3xl font-bold mb-1 text-center">إضافة مزود نقل</Text>
            <Text className="text-gray-600 mb-8 text-center">
              أدخل المعلومات لإنشاء حساب النقل الخاص بك
            </Text>
          </View>

          {/* عرض الخطأ */}
          {error && (
            <View className="bg-red-100 p-3 rounded-md mb-4">
              <Text className="text-red-700">{error}</Text>
            </View>
          )}

          {/* النموذج */}
          <View className="gap-3">
            <TextInput
              placeholder="نوع الحساب (فردي / شركة)"
              value={form.accountType}
              onChangeText={(v) => setForm({ ...form, accountType: v })}
              className="border border-gray-300 rounded-lg p-3"
            />
            <TextInput
              placeholder="رقم المحفظة"
              value={form.walletAccount}
              onChangeText={(v) => setForm({ ...form, walletAccount: v })}
              className="border border-gray-300 rounded-lg p-3"
            />
            <TextInput
              placeholder="المناطق المغطاة"
              value={form.coveredAreas}
              onChangeText={(v) => setForm({ ...form, coveredAreas: v })}
              className="border border-gray-300 rounded-lg p-3"
            />
            <TextInput
              placeholder="عدد العمال المتاحين"
              keyboardType="numeric"
              value={form.workersAvailable}
              onChangeText={(v) => setForm({ ...form, workersAvailable: v })}
              className="border border-gray-300 rounded-lg p-3"
            />
            <TextInput
              placeholder="ساعات العمل اليومية"
              value={form.availabilityHours}
              onChangeText={(v) => setForm({ ...form, availabilityHours: v })}
              className="border border-gray-300 rounded-lg p-3"
            />
            <TextInput
              placeholder="طريقة الدفع المفضلة (كاش / تحويل / محفظة)"
              value={form.preferredPaymentMethod}
              onChangeText={(v) => setForm({ ...form, preferredPaymentMethod: v })}
              className="border border-gray-300 rounded-lg p-3"
            />
            <TextInput
              placeholder="السعر التقريبي لكل كم"
              keyboardType="numeric"
              value={form.estimatedPricePerKm}
              onChangeText={(v) => setForm({ ...form, estimatedPricePerKm: v })}
              className="border border-gray-300 rounded-lg p-3"
            />
          </View>

          {/* زر الإرسال */}
          <TouchableOpacity
            disabled={loading}
            onPress={handleSubmit}
            className={`mt-6 py-3 rounded-lg ${loading ? "bg-gray-400" : "bg-green-600"}`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-white text-lg font-bold">انشاء</Text>
            )}
          </TouchableOpacity>

          {/* رجوع */}

        </View>
      </View>
    </ScrollView>
  );
}

// export default function TransportCreatePlaceholder() {
//   return <View />;
// }