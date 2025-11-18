import {
  completeRegistrationStep4,
  deleteRegistrationDocument,
  listRegistrationDocuments,
  uploadRegistrationDocument,
} from "@/services/registration";
import {
  getRegistrationId,
  getSelectedRole,
} from "@/storage/registration-storage";
import type { UserRole } from "@/types/registration";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';

type DocTypeDef = {
  id: number;
  label: string;
  labelAr: string;
  optional?: boolean;
};

const roleDocMap: Record<UserRole, DocTypeDef[]> = {
  farmer: [
    {
      id: 1,
      label: "National ID Photo",
      labelAr: "هوية شخصية",
      optional: true,
    },
    {
      id: 2,
      label: "Policy Agreement",
      labelAr: "اتفاقية السياسة",
      optional: true,
    },
    {
      id: 3,
      label: "Payout Method Proof",
      labelAr: "إثبات طريقة الدفع",
      optional: true,
    },
  ],
  trader: [
    {
      id: 10,
      label: "Commercial License Photo",
      labelAr: "صورة الترخيص التجاري",
    },
    {
      id: 11,
      label: "Commercial License Number",
      labelAr: "رقم الترخيص التجاري",
    },
    { id: 12, label: "Tax Number", labelAr: "الرقم الضريبي" },
  ],
  transporter: [
    { id: 20, label: "Company License", labelAr: "ترخيص الشركة" },
    { id: 21, label: "Driver License", labelAr: "رخصة القيادة" },
  ],
};

export default function DocumentsScreen() {
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocTypeDef | null>(
    null
  );
  const [showDocTypePicker, setShowDocTypePicker] = useState(false);
  const [numberText, setNumberText] = useState("");
  const [issuedBy, setIssuedBy] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [UploadDOC, setUploadDOC] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    getRegistrationId().then(setRegistrationId);
    getSelectedRole().then(setRole);
  }, []);

  useEffect(() => {
    if (!registrationId) return;
    listRegistrationDocuments(registrationId)
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) setDocuments(res.data);
      })
      .catch(() => {});
  }, [registrationId]);

  const docsForRole = useMemo(() => (role ? roleDocMap[role] : []), [role]);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.length) {
      const asset = res.assets[0];
      setFile({
        uri: asset.uri,
        name: asset.fileName || `upload.${asset.type || "jpg"}`,
        type: asset.mimeType || "image/jpeg",
      });
    }
  };

  const takePhoto = async () => {
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets?.length) {
      const asset = res.assets[0];
      setFile({
        uri: asset.uri,
        name: asset.fileName || "photo.jpg",
        type: asset.mimeType || "image/jpeg",
      });
    }
  };

  const onUpload = async () => {
    if (!registrationId || !selectedDocType || !file) {
      Alert.alert("خطأ", "الرجاء اختيار نوع المستند ورفع ملف");
      return;
    }

    if (expiryDate === "") {
      Alert.alert("خطأ", "الرجاء إدخال تاريخ الانتهاء");
      return;
    }
    setLoading(true);
    try {
      const res = await uploadRegistrationDocument({
        registrationId,
        docType: selectedDocType.id,
        number: numberText || undefined,
        issuedBy: issuedBy || undefined,
        expiryDate: expiryDate || undefined,
        file,
      });
      if (res.success) {
        setNumberText("");
        setIssuedBy("");
        setExpiryDate("");
        setFile(null);
        setSelectedDocType(null);
        const list = await listRegistrationDocuments(registrationId);
        if (list.success && Array.isArray(list.data)) setDocuments(list.data);
        Alert.alert("تم الرفع", "تم رفع المستند بنجاح");
      }
    } catch (e: any) {
      Alert.alert("خطأ", "فشل رفع المستند");
    } finally {
      setLoading(false);
      setUploadDOC(true);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      const formatted = selectedDate.toISOString().split("T")[0]; // YYYY-MM-DD
      setExpiryDate(formatted);
    }
  };
  const onDelete = async (id: number) => {
    if (!registrationId) return;
    try {
      await deleteRegistrationDocument(registrationId, id);
      const list = await listRegistrationDocuments(registrationId);
      if (list.success && Array.isArray(list.data)) setDocuments(list.data);
    } catch {}
  };

  const onComplete = async () => {
    if (!registrationId) return;
    try {
      await completeRegistrationStep4(registrationId);
      router.replace("/registration/payout");
    } catch (e: any) {
      Alert.alert("خطأ", e?.message || "فشل إكمال الخطوة");
    }
  };

  const onSkip = () => {
    router.replace("/registration/payout");
  };

  if (!role) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-white items-center justify-center">
          <ActivityIndicator size="large" color="#065f46" />
          <Text
            className="mt-4 text-gray-600 text-lg"
            style={{ fontFamily: "Cairo-Regular" }}
          >
            جاري التحميل...
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
          {/* Header */}
          <View className="flex-row-reverse items-center justify-end mb-8 mt-12">
            <Text
              className="text-2xl font-bold text-gray-900 text-left"
              style={{ fontFamily: "Cairo-Bold" }}
            >
              المستندات الشخصية
            </Text>
            <TouchableOpacity onPress={() => router.back()} className="mr-2">
              <Ionicons name="arrow-forward" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Document Type Picker */}
          <View className="mb-6">
            <Text
              className="text-base mb-2 text-left"
              style={{ fontFamily: "Cairo-Regular" }}
            >
              نوع المستند
            </Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-lg px-4 py-4 bg-white flex-row-reverse items-center justify-between"
              onPress={() => setShowDocTypePicker(true)}
            >
              <Text
                className="text-base"
                style={{
                  fontFamily: "Cairo-Regular",
                  color: selectedDocType ? "#000" : "#D1D5DB",
                }}
              >
                {selectedDocType
                  ? selectedDocType.labelAr
                  : "نوع المستند المرفق"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Document Type Picker Modal */}
          <Modal
            visible={showDocTypePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDocTypePicker(false)}
          >
            <TouchableOpacity
              className="flex-1 bg-black/50"
              activeOpacity={1}
              onPress={() => setShowDocTypePicker(false)}
            >
              <View className="flex-1 justify-end">
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View className="bg-white rounded-t-3xl">
                    <View className="flex-row-reverse items-center justify-between p-6 border-b border-gray-200">
                      <Text
                        className="text-xl font-bold"
                        style={{ fontFamily: "Cairo-Bold" }}
                      >
                        اختر نوع المستند
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowDocTypePicker(false)}
                      >
                        <Ionicons name="close" size={28} color="#000" />
                      </TouchableOpacity>
                    </View>
                    <ScrollView className="max-h-96">
                      {docsForRole.map((doc) => (
                        <TouchableOpacity
                          key={doc.id}
                          className="flex-row-reverse items-center justify-between px-6 py-4 border-b border-gray-100"
                          onPress={() => {
                            setSelectedDocType(doc);
                            setShowDocTypePicker(false);
                          }}
                        >
                          <View className="flex-row-reverse items-center">
                            <View
                              className="w-6 h-6 rounded border-2 items-center justify-center ml-3"
                              style={{
                                borderColor:
                                  selectedDocType?.id === doc.id
                                    ? "#065f46"
                                    : "#D1D5DB",
                                backgroundColor:
                                  selectedDocType?.id === doc.id
                                    ? "#065f46"
                                    : "transparent",
                              }}
                            >
                              {selectedDocType?.id === doc.id && (
                                <Ionicons
                                  name="checkmark"
                                  size={16}
                                  color="#FFF"
                                />
                              )}
                            </View>
                            <Text
                              className="text-base"
                              style={{ fontFamily: "Cairo-Regular" }}
                            >
                              {doc.labelAr}
                            </Text>
                          </View>
                          {doc.optional && (
                            <Text
                              className="text-sm text-gray-500"
                              style={{ fontFamily: "Cairo-Regular" }}
                            >
                              (اختياري)
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Optional Fields */}
          {selectedDocType && (
            <>
              <View className="mb-6">
                <Text
                  className="text-base mb-2 text-left"
                  style={{ fontFamily: "Cairo-Regular" }}
                >
                  رقم المستند
                </Text>
                <TextInput
                  placeholder="ادخل رقم المستند"
                  placeholderTextColor="#D1D5DB"
                  value={numberText}
                  onChangeText={setNumberText}
                  className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                  style={{ fontFamily: "Cairo-Regular" }}
                  textAlign="right"
                />
              </View>

              <View className="mb-6">
                <Text
                  className="text-base mb-2 text-left"
                  style={{ fontFamily: "Cairo-Regular" }}
                >
                  جهة الإصدار
                </Text>
                <TextInput
                  placeholder="ادخل جهة الإصدار"
                  placeholderTextColor="#D1D5DB"
                  value={issuedBy}
                  onChangeText={setIssuedBy}
                  className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                  style={{ fontFamily: "Cairo-Regular" }}
                  textAlign="right"
                />
              </View>

              <View className="mb-6">
                <Text
                  className="text-base mb-2 text-left"
                  style={{ fontFamily: "Cairo-Regular" }}
                >
                  تاريخ الانتهاء
                </Text>
                <Pressable onPress={() => setShowPicker(true)}>
                  <TextInput
                    value={expiryDate}
                    placeholder="YYYY-MM-DD"
                    editable={false}
                    pointerEvents="none"
                    placeholderTextColor="#D1D5DB"
                    className="border border-gray-300 rounded-lg px-4 py-4 text-right text-base bg-white"
                    style={{ fontFamily: "Cairo-Regular" }}
                    textAlign="right"
                  />
                </Pressable>

                {showPicker && (
                  <DateTimePicker
                    value={expiryDate ? new Date(expiryDate) : new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onChangeDate}
                  />
                )}
              </View>
            </>
          )}

          {/* File Upload Section */}
          <View className="mb-8">
            <Text
              className="text-base mb-2 text-left"
              style={{ fontFamily: "Cairo-Regular" }}
            >
              المستندات (الهويات / جوازات السفر)
              <Text className="text-red-500">*</Text>
            </Text>

            {file ? (
              <View className="border-2 border-dashed border-gray-300 rounded-lg p-4 items-center">
                <Image
                  source={{ uri: file.uri }}
                  className="w-40 h-40 rounded-lg mb-4"
                />
                <Text
                  className="text-sm text-gray-600 mb-4"
                  style={{ fontFamily: "Cairo-Regular" }}
                >
                  {file.name}
                </Text>
                <View className="flex-row gap-4">
                  <TouchableOpacity
                    className="bg-green-700 px-6 py-3 rounded-lg flex-row items-center"
                    onPress={onUpload}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons
                          name="cloud-upload-outline"
                          size={20}
                          color="#FFF"
                        />
                        <Text
                          className="text-white text-base font-bold mr-2"
                          style={{ fontFamily: "Cairo-SemiBold" }}
                        >
                          رفع
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="border border-gray-300 px-6 py-3 rounded-lg"
                    onPress={() => setFile(null)}
                  >
                    <Text
                      className="text-gray-700 text-base font-bold"
                      style={{ fontFamily: "Cairo-SemiBold" }}
                    >
                      إلغاء
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="border-2 border-dashed border-gray-300 rounded-lg p-6 items-center">
                <Ionicons
                  name="cloud-upload-outline"
                  size={48}
                  color="#9CA3AF"
                />
                <Text
                  className="text-gray-400 text-base text-center mt-4 mb-6"
                  style={{ fontFamily: "Cairo-Regular" }}
                >
                  رفع المستند
                </Text>
                <View className="flex-row gap-4">
                  <TouchableOpacity
                    className="bg-gray-100 px-6 py-3 rounded-lg flex-row items-center"
                    onPress={pickImage}
                  >
                    <Ionicons name="image-outline" size={20} color="#065f46" />
                    <Text
                      className="text-green-700 text-base font-bold mr-2"
                      style={{ fontFamily: "Cairo-SemiBold" }}
                    >
                      معرض الصور
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-gray-100 px-6 py-3 rounded-lg flex-row items-center"
                    onPress={takePhoto}
                  >
                    <Ionicons name="camera-outline" size={20} color="#065f46" />
                    <Text
                      className="text-green-700 text-base font-bold mr-2"
                      style={{ fontFamily: "Cairo-SemiBold" }}
                    >
                      التقاط صورة
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Uploaded Documents List */}
          {documents.length > 0 && (
            <View className="mb-8">
              <Text
                className="text-lg font-bold mb-4 text-left"
                style={{ fontFamily: "Cairo-Bold" }}
              >
                المستندات المرفوعة
              </Text>
              {documents.map((item: any) => (
                <View
                  key={item.id || item.documentId}
                  className="border border-gray-200 rounded-lg p-4 mb-4"
                >
                  <View className="flex-row-reverse items-start justify-between mb-4">
                    <View className="flex-1">
                      <Text
                        className="text-base font-semibold text-right mb-2"
                        style={{ fontFamily: "Cairo-SemiBold" }}
                      >
                        مستند #{item.documentId || item.id}
                      </Text>
                      {item.number && (
                        <Text
                          className="text-sm text-gray-600 text-right"
                          style={{ fontFamily: "Cairo-Regular" }}
                        >
                          الرقم: {item.number}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => onDelete(item.documentId || item.id)}
                      className="bg-red-50 p-2 rounded-lg"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#DC2626"
                      />
                    </TouchableOpacity>
                  </View>
                  {item.fileUrl && (
                    <Image
                      source={{ uri: item.fileUrl }}
                      className="w-full h-40 rounded-lg"
                      resizeMode="cover"
                    />
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View className="gap-4 mt-auto">
            <TouchableOpacity
              className="bg-green-700 py-4 rounded-xl"
              onPress={
                UploadDOC
                  ? onComplete
                  : () =>
                      Alert.alert(
                        "تنبيه",
                        "الرجاء رفع المستندات المطلوبة قبل المتابعة"
                      )
              }
            >
              <Text
                className="text-white text-center text-lg font-bold"
                style={{ fontFamily: "Cairo-SemiBold" }}
              >
                التالي
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="border-2 border-gray-300 py-4 rounded-xl"
              onPress={onSkip}
            >
              <Text
                className="text-gray-700 text-center text-lg font-bold"
                style={{ fontFamily: "Cairo-SemiBold" }}
              >
                تخطي
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
