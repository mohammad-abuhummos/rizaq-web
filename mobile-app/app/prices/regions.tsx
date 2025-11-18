import React from "react";
import {
    View
} from "react-native";

// export default function RegionsScreen() {
//   const [regions, setRegions] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await getTransportRegions();
//         setRegions(res || []);
//       } catch (err) {
//         console.error("Failed to fetch regions:", err);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   if (loading)
//     return (
//       <View className="flex-1 justify-center items-center bg-gray-50">
//         <ActivityIndicator size="large" color="#16a34a" />
//         <Text className="text-gray-600 mt-3">جاري تحميل المناطق...</Text>
//       </View>
//     );

//   return (
//     <View className="flex-1 bg-gray-50">
//       {/* 🔹 Header */}
//       <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center justify-between">
//         <Text className="text-2xl font-bold text-gray-900 text-center flex-1">
//           مناطق النقل
//         </Text>
//       </View>

//       {/* 🔹 Content */}
//       <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
//         <FlatList
//           data={regions}
//           keyExtractor={(item, index) => `${item}-${index}`}
//           renderItem={({ item }) => (
//             <TouchableOpacity className="mx-4 my-2 bg-white p-4 rounded-2xl border border-gray-200 flex-row items-center shadow-sm">
//               <View className="bg-green-100 p-3 rounded-full ml-3">
//                 <MapPin size={22} color="#16a34a" />
//               </View>
//               <View className="flex-1 mr-2">
//                 <Text className="text-gray-900 font-bold text-lg text-right">
//                   {item}
//                 </Text>
               
//               </View>
//               <ChevronLeft size={20} color="#9ca3af" />
//             </TouchableOpacity>
//           )}
//         />
//       </ScrollView>
//     </View>
//   );
// }

export default function RegionsPlaceholder() {
  return <View />;
}