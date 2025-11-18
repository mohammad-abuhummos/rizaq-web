import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { createTransportOffer } from "@/services/transport";
// import { useAuth } from "@/context/AuthContext";

export default function CreateTransportOfferScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // transportRequestId
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    transportRequestId: Number(id) || 0,
    offeredPrice: "",
    estimatedPickupDate: new Date().toISOString().split("T")[0],
    estimatedDeliveryDate: new Date().toISOString().split("T")[0],
    notes: "",
    status: "pending",
  });

  const handleSubmit = async () => {
    const transporterId = user?.id ? Number(user.id) : NaN;

    if (!transporterId || Number.isNaN(transporterId)) {
      Alert.alert(
        "تسجيل الدخول مطلوب",
        "يجب تسجيل الدخول لتقديم عرض نقل.",
        [
          { text: "تسجيل الدخول", onPress: () => router.push("/login") },
          { text: "إلغاء", style: "cancel" },
        ]
      );
      return;
    }

    if (!form.offeredPrice) {
      Alert.alert("تنبيه", "يرجى إدخال السعر المقترح للعرض");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        transportRequestId: form.transportRequestId,
        transporterId,
        offeredPrice: Number(form.offeredPrice),
        estimatedPickupDate: new Date(form.estimatedPickupDate).toISOString(),
        estimatedDeliveryDate: new Date(form.estimatedDeliveryDate).toISOString(),
        notes: form.notes.trim(),
        status: form.status,
      };

      const res = await createTransportOffer(payload);
      const newOfferId = res?.data?.offerId || res?.offerId || Math.floor(Math.random() * 100000);

      console.log("✅ Offer created successfully with ID:", newOfferId);

      const newOffer = {
        ...payload,
        transportOfferId: newOfferId,
      };

      Alert.alert("✅ تم الإرسال بنجاح", "تم تقديم عرض النقل بنجاح");

      // ⬇️ إرسال بيانات العرض الجديد إلى شاشة التفاصيل مباشرة
      router.replace({
        pathname: `/requests/${form.transportRequestId}`,
        params: { newOffer: JSON.stringify(newOffer) },
      });
    } catch (err) {
      console.error("🚨 Error creating offer:", err);
      Alert.alert("⚠️ فشل الإرسال", "تأكد من البيانات وحاول مجددًا");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-4 py-4 bg-white border-b border-gray-200 shadow-sm">
        <Text className="text-2xl font-bold text-gray-900 text-center">إنشاء عرض نقل جديد</Text>
      </View>

      <View className="p-5 bg-white mx-4 mt-4 rounded-2xl border border-gray-200 shadow-sm">
        <FormInput label="رقم الطلب" value={String(form.transportRequestId)} editable={false} />
        <FormInput
          label="السعر المقترح (درهم)"
          value={form.offeredPrice}
          keyboardType="numeric"
          onChangeText={(v) => setForm({ ...form, offeredPrice: v })}
        />
        <FormInput
          label="تاريخ الاستلام المتوقع"
          value={form.estimatedPickupDate}
          onChangeText={(v) => setForm({ ...form, estimatedPickupDate: v })}
        />
        <FormInput
          label="تاريخ التسليم المتوقع"
          value={form.estimatedDeliveryDate}
          onChangeText={(v) => setForm({ ...form, estimatedDeliveryDate: v })}
        />
        <FormInput
          label="ملاحظات إضافية"
          value={form.notes}
          onChangeText={(v) => setForm({ ...form, notes: v })}
          multiline
        />

        <TouchableOpacity
          disabled={loading}
          onPress={handleSubmit}
          className={`mt-6 py-4 rounded-lg ${loading ? "bg-gray-400" : "bg-green-600"}`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-lg font-bold text-center">إرسال العرض</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} className="mt-3 py-3 bg-gray-200 rounded-lg">
          <Text className="text-center text-gray-700 font-semibold">إلغاء</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function FormInput({ label, value, onChangeText, keyboardType, multiline, editable = true }) {
  return (
    <View className="mb-3">
      <Text className="text-gray-700 mb-1 font-semibold text-right">{label}</Text>
      <TextInput
        className={`border border-gray-300 bg-white rounded-lg p-3 text-right ${
          !editable ? "bg-gray-100 text-gray-500" : ""
        }`}
        value={value}
        editable={editable}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}
