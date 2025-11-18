import React from "react";
import {
    View
} from "react-native";

// export default function CreateTransportRequestScreen() {
//   const router = useRouter();
//   const { user } = useAuth(); // ✅ المستخدم الحالي
//   const [loading, setLoading] = useState(false);
//   const [form, setForm] = useState({
//     orderId: "",
//     fromRegion: "",
//     toRegion: "",
//     distanceKm: "",
//     productType: "",
//     weightKg: "",
//     preferredPickupDate: new Date().toISOString().split("T")[0],
//     preferredDeliveryDate: new Date().toISOString().split("T")[0],
//     specialRequirements: "",
//   });

//   const handleSubmit = async () => {
//     const userId = user?.id ? Number(user.id) : NaN;
//     console.log('userId', userId, user?.id)

//     if (!userId || Number.isNaN(userId)) {
//       Alert.alert(
//         "تسجيل الدخول مطلوب",
//         "يجب تسجيل الدخول لإنشاء طلب نقل جديد.",
//         [
//           { text: "تسجيل الدخول", onPress: () => router.push("/login") },
//           { text: "إلغاء", style: "cancel" },
//         ]
//       );
//       return;
//     }

//     if (!form.fromRegion || !form.toRegion || !form.productType) {
//       Alert.alert("تنبيه", "الرجاء تعبئة الحقول المطلوبة");
//       return;
//     }

//     try {
//       setLoading(true);

//       const payload = {
//         buyerUserId: userId,
//         orderId: Number(form.orderId) || 0,
//         fromRegion: form.fromRegion.trim(),
//         toRegion: form.toRegion.trim(),
//         distanceKm: Number(form.distanceKm) || 0,
//         productType: form.productType.trim(),
//         weightKg: Number(form.weightKg) || 0,
//         preferredPickupDate: new Date(form.preferredPickupDate).toISOString(),
//         preferredDeliveryDate: new Date(form.preferredDeliveryDate).toISOString(),
//         specialRequirements: form.specialRequirements.trim(),
//       };

//       console.log("📦 Sending transport request payload:", payload);

//       const res = await createTransportRequest(payload);

//       if (res) {
//         console.log(`✅ Request created by user ${userId}`);
//         Alert.alert("✅ تم الإرسال بنجاح", "تم إنشاء طلب النقل بنجاح");
//         router.push(`/requests/${res.requestId}`);
//       } else {
//         Alert.alert("❌ خطأ", "حدث خطأ أثناء إنشاء الطلب، حاول مجددًا");
//       }
//     } catch (err) {
//       console.error("🚨 Error creating request:", err);
//       Alert.alert("⚠️ فشل الإرسال", "تأكد من البيانات وحاول مجددًا");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <ScrollView
//       className="flex-1 bg-gray-50"
//       contentContainerStyle={{ paddingBottom: 40 }}
//     >
//       <View className="px-4 py-4 bg-white border-b border-gray-200 shadow-sm">
//         <Text className="text-2xl font-bold text-gray-900 text-center">
//           إنشاء طلب نقل جديد
//         </Text>
//       </View>

//       <View className="p-5 bg-white mx-4 mt-4 rounded-2xl border border-gray-200 shadow-sm">
//         <FormInput label="رقم الطلب (اختياري)" value={form.orderId} keyboardType="numeric" onChangeText={(v) => setForm({ ...form, orderId: v })} />
//         <FormInput label="منطقة الانطلاق" value={form.fromRegion} onChangeText={(v) => setForm({ ...form, fromRegion: v })} />
//         <FormInput label="منطقة الوجهة" value={form.toRegion} onChangeText={(v) => setForm({ ...form, toRegion: v })} />
//         <FormInput label="المسافة (كم)" value={form.distanceKm} keyboardType="numeric" onChangeText={(v) => setForm({ ...form, distanceKm: v })} />
//         <FormInput label="نوع المنتج" value={form.productType} onChangeText={(v) => setForm({ ...form, productType: v })} />
//         <FormInput label="الوزن (كغ)" value={form.weightKg} keyboardType="numeric" onChangeText={(v) => setForm({ ...form, weightKg: v })} />
//         <FormInput label="تاريخ الاستلام المفضل (YYYY-MM-DD)" value={form.preferredPickupDate} onChangeText={(v) => setForm({ ...form, preferredPickupDate: v })} />
//         <FormInput label="تاريخ التسليم المفضل (YYYY-MM-DD)" value={form.preferredDeliveryDate} onChangeText={(v) => setForm({ ...form, preferredDeliveryDate: v })} />
//         <FormInput label="متطلبات خاصة" value={form.specialRequirements} onChangeText={(v) => setForm({ ...form, specialRequirements: v })} multiline />

//         <TouchableOpacity
//           disabled={loading}
//           onPress={handleSubmit}
//           className={`mt-6 py-4 rounded-lg ${
//             loading ? "bg-gray-400" : "bg-green-600"
//           }`}
//         >
//           {loading ? (
//             <ActivityIndicator color="#fff" />
//           ) : (
//             <Text className="text-white text-lg font-bold text-center">
//               إرسال الطلب
//             </Text>
//           )}
//         </TouchableOpacity>

//         <TouchableOpacity
//           onPress={() => router.back()}
//           className="mt-3 py-3 bg-gray-200 rounded-lg"
//         >
//           <Text className="text-center text-gray-700 font-semibold">إلغاء</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// }

export default function CreateTransportRequestPlaceholder() {
  return <View />;
}

// function FormInput({
//   label,
//   value,
//   onChangeText,
//   keyboardType,
//   multiline,
// }: {
//   label: string;
//   value?: string;
//   onChangeText: (v: string) => void;
//   keyboardType?: "default" | "numeric";
//   multiline?: boolean;
// }) {
//   return (
//     <View className="mb-3">
//       <Text className="text-gray-700 mb-1 font-semibold text-right">{label}</Text>
//       <TextInput
//         className="border border-gray-300 bg-white rounded-lg p-3 text-right"
//         value={value}
//         onChangeText={onChangeText}
//         keyboardType={keyboardType}
//         multiline={multiline}
//         numberOfLines={multiline ? 3 : 1}
//         placeholder={`أدخل ${label}`}
//       />
//     </View>
//   );
// }
