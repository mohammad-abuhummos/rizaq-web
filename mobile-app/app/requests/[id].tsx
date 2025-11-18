import React from "react";
import {
    View
} from "react-native";

// export default function TransportRequestDetailScreen() {
//   const { id } = useLocalSearchParams();
//   const router = useRouter();
//   const { user } = useAuth(); // ✅ الوصول للمستخدم الحالي

//   const [request, setRequest] = useState<any>(null);
//   const [offers, setOffers] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [accepting, setAccepting] = useState(false);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         if (!id) return;

//         const res = await getTransportRequestById(Number(id));
//         const offerList = await getOffersForRequest(Number(id));

//         setRequest(res?.data || res);
//         setOffers(offerList?.data || offerList || []);
//       } catch (err) {
//         console.error("❌ Failed to fetch transport request details:", err);
//         Alert.alert("خطأ", "تعذر تحميل بيانات الطلب");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [id]);

//   // ✅ التحقق من تسجيل الدخول
//   useEffect(() => {
//     if (!user) {
//       Alert.alert(
//         "تنبيه",
//         "يجب تسجيل الدخول لمتابعة تفاصيل الطلب.",
//         [
//           {
//             text: "تسجيل الدخول",
//             onPress: () => router.push("/login"),
//           },
//         ],
//         { cancelable: false }
//       );
//     }
//   }, [user]);

// const handleAcceptOffer = async (offer: any) => {
//   if (!user) {
//     Alert.alert("خطأ", "يجب تسجيل الدخول لقبول العرض");
//     return;
//   }

//   Alert.alert("تأكيد", "هل أنت متأكد أنك تريد قبول هذا العرض؟", [
//     { text: "إلغاء", style: "cancel" },
//     {
//       text: "نعم، أوافق ✅",
//       onPress: async () => {
//         try {
//           setAccepting(true);

//           // 🔹 نحاول نجيب الـ offerId من أكثر من احتمال
//           const offerId =
//             offer.transportOfferId || offer.offerId || offer.transporterId;

//           if (!offerId) {
//             Alert.alert("خطأ", "لم يتم العثور على معرف العرض");
//             return;
//           }

//           console.log("📤 Sending accept for offerId:", offerId);
//           const result = await acceptTransportOffer(offerId);
//           console.log("📦 Accept offer raw result:", result);

//           // ✅ منطق ذكي لقراءة النجاح من أي شكل ممكن
//           const message =
//             result?.data?.message ||
//             result?.message ||
//             result?.data?.data?.message;

//           const isSuccess =
//             result?.success === true ||
//             result?.data?.success === true ||
//             (typeof message === "string" &&
//               message.includes("تم قبول عرض النقل"));

//           if (isSuccess) {
//             Alert.alert("✅ تم بنجاح", message || "تم قبول العرض بنجاح");
//             // router.push("/home");
//           } else {
//             console.warn("❌ Accept failed, full response:", result);
//             Alert.alert("خطأ", "تعذر قبول العرض، حاول لاحقًا");
//           }
//         } catch (err) {
//           console.error("🚨 Failed to accept offer:", err);
//           Alert.alert("خطأ", "حدث خطأ أثناء قبول العرض");
//         } finally {
//           setAccepting(false);
//         }
//       },
//     },
//   ]);
// };


//   if (loading)
//     return (
//       <View className="flex-1 justify-center items-center bg-gray-50">
//         <ActivityIndicator size="large" color="#16a34a" />
//         <Text className="mt-2 text-gray-600">جاري تحميل تفاصيل الطلب...</Text>
//       </View>
//     );

//   if (!request)
//     return (
//       <View className="flex-1 justify-center items-center bg-gray-50">
//         <Text className="text-gray-500 text-lg">تعذر العثور على الطلب</Text>
//       </View>
//     );

//   return (
//     <ScrollView
//       className="flex-1 bg-gray-50"
//       contentContainerStyle={{ paddingBottom: 40 }}
//     >
//       {/* Header */}
//       <View className="px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
//         <Text className="text-2xl font-bold text-gray-900 text-center">
//           تفاصيل طلب النقل
//         </Text>
//       </View>

//       {/* Request Info */}
//       <View className="mx-4 mt-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
//         <View className="flex-row items-center mb-3">
//           <View className="bg-green-600 p-3 rounded-full">
//             <Truck size={24} color="#fff" />
//           </View>
//           <Text className="text-lg font-bold text-gray-900 mr-3">
//             رقم الطلب #{request.transportRequestId || "—"}
//           </Text>
//         </View>

//         <DetailItem
//           label="منطقة الانطلاق"
//           value={request.fromRegion}
//           icon={<MapPin size={18} color="#16a34a" />}
//         />
//         <DetailItem
//           label="منطقة الوجهة"
//           value={request.toRegion}
//           icon={<MapPin size={18} color="#16a34a" />}
//         />
//         <DetailItem
//           label="المسافة (كم)"
//           value={`${request.distanceKm}`}
//           icon={<Truck size={18} color="#16a34a" />}
//         />
//         <DetailItem
//           label="نوع المنتج"
//           value={request.productType}
//           icon={<Package size={18} color="#16a34a" />}
//         />
//         <DetailItem
//           label="الوزن (كغ)"
//           value={`${request.weightKg}`}
//           icon={<Weight size={18} color="#16a34a" />}
//         />
//         <DetailItem
//           label="تاريخ الإنشاء"
//           value={new Date(request.createdAt).toLocaleDateString("ar-EG")}
//           icon={<Calendar size={18} color="#16a34a" />}
//         />
//         <DetailItem label="الحالة" value={request.status} highlight />
//       </View>

//       {/* Offers Section */}
//       <View className="mx-4 mt-6 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
//         <Text className="text-xl font-bold text-gray-900 mb-4 text-center">
//           العروض المقدمة
//         </Text>

//         {offers.length === 0 ? (
//           <Text className="text-gray-500 text-center">
//             لا يوجد عروض حالياً لهذا الطلب
//           </Text>
//         ) : (
//           offers.map((offer, index) => (
//             <TouchableOpacity
//               key={index}
//               onPress={() => handleAcceptOffer(offer)}
//               disabled={accepting}
//               className={`mb-3 border border-gray-200 rounded-xl p-4 ${
//                 accepting ? "bg-gray-200" : "bg-gray-50"
//               }`}
//             >
//               <View className="flex-row justify-between mb-2">
//                 <Text className="text-lg font-bold text-green-700">
//                   {offer.offeredPrice} درهم
//                 </Text>
//                 <Text className="text-gray-700 font-semibold">
//                   العرض رقم #{offer.transportOfferId || offer.transporterId}
//                 </Text>
//               </View>
//               <Text className="text-gray-600">
//                 <Text className="font-semibold text-gray-800">
//                   تاريخ التسليم المتوقع:{" "}
//                 </Text>
//                 {new Date(offer.estimatedDeliveryDate).toLocaleDateString(
//                   "ar-EG"
//                 )}
//               </Text>
//               <Text className="text-gray-600">
//                 <Text className="font-semibold text-gray-800">
//                   تاريخ الاستلام المتوقع:{" "}
//                 </Text>
//                 {new Date(offer.estimatedPickupDate).toLocaleDateString(
//                   "ar-EG"
//                 )}
//               </Text>
//               <Text className="text-gray-600 mt-1">
//                 <Text className="font-semibold text-gray-800">الملاحظات: </Text>
//                 {offer.notes || "—"}
//               </Text>
//             </TouchableOpacity>
//           ))
//         )}
//       </View>

//       {/* Create Offer Button */}
//       <TouchableOpacity
//         onPress={() => {
//           if (!user) {
//             Alert.alert("تنبيه", "يجب تسجيل الدخول لتقديم عرض", [
//               { text: "تسجيل الدخول", onPress: () => router.push("/login") },
//             ]);
//           } else {
//             router.push(`/offers/create?id=${id}`);
//           }
//         }}
//         className="mx-6 mt-6 py-4 bg-green-600 rounded-lg"
//       >
//         <Text className="text-center text-white font-semibold text-lg">
//           💰 تقديم عرض نقل
//         </Text>
//       </TouchableOpacity>

//       {/* Back Button */}
//       <TouchableOpacity
//         onPress={() => router.back()}
//         className="mx-6 mt-6 py-4 bg-gray-200 rounded-lg"
//       >
//         <Text className="text-center text-gray-800 font-semibold text-lg">
//           رجوع
//         </Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }

export default function RequestPlaceholder() {
  return <View />;
}

// // ✅ Component for info rows
// function DetailItem({
//   label,
//   value,
//   icon,
//   highlight,
// }: {
//   label: string;
//   value?: string;
//   icon?: React.ReactNode;
//   highlight?: boolean;
// }) {
//   return (
//     <View className="flex-row items-center justify-between border-b border-gray-100 py-2">
//       <View className="flex-row items-center">
//         {icon && <View className="ml-2">{icon}</View>}
//         <Text
//           className={`text-right ml-2 ${
//             highlight ? "text-green-700 font-semibold" : "text-gray-800"
//           }`}
//         >
//           {value || "—"}
//         </Text>
//       </View>
//       <Text className="text-gray-600 font-semibold text-right">{label}</Text>
//     </View>
//   );
// }
