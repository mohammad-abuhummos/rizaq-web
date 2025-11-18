import { setRoleName } from '@/services/registration';
import { getRegistrationId, getSelectedRole, saveSelectedRole } from '@/storage/registration-storage';
import type { UserRole } from '@/types/registration';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const roles: { value: UserRole; label: string }[] = [
    { value: 'farmer', label: 'مزارع' },
    { value: 'trader', label: 'تاجر' },
    { value: 'transporter', label: 'ناقل / موصل' },
];

export default function RoleScreen() {
    const [registrationId, setRegistrationId] = useState<string | null>(null);
    const [selected, setSelected] = useState<UserRole | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        getRegistrationId().then(setRegistrationId);
        getSelectedRole().then((role) => role && setSelected(role));
    }, []);

    const onSubmit = async () => {
        if (!registrationId || !selected) {
            Alert.alert('خطأ', !registrationId ? 'جلسة التسجيل مفقودة' : 'الرجاء اختيار دور');
            return;
        }
        setSubmitting(true);
        try {
            const res = await setRoleName({ registrationId, roleName: selected });
            if (res.success) {
                await saveSelectedRole(selected);
                router.replace('/registration/details');
            }
        } catch (e: any) {
            Alert.alert('خطأ', e?.message || 'فشل حفظ الدور');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView
                className="flex-1 bg-white"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
                    {/* Header */}
                    <View className="flex-row-reverse items-center justify-end mb-8 mt-12">
                        <Text
                            className="text-2xl font-bold text-gray-900 text-left"
                            style={{ fontFamily: 'Cairo-Bold' }}
                        >
                            الدور الوظيفي
                        </Text>
                        <TouchableOpacity onPress={() => router.back()} className="mr-2">
                            <Ionicons name="arrow-forward" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* Section Label */}
                    <Text
                        className="text-lg text-left mb-6 text-gray-700"
                        style={{ fontFamily: 'Cairo-Regular' }}
                    >
                        اختر مجالك المهني
                    </Text>

                    {/* Role Options */}
                    <View className="mb-8">
                        {roles.map((role) => (
                            <TouchableOpacity
                                key={role.value}
                                onPress={() => setSelected(role.value)}
                                className="flex-row-reverse items-center justify-between px-6 py-4 mb-4 border-2 rounded-xl"
                                style={{
                                    borderColor: selected === role.value ? '#065f46' : '#E5E7EB',
                                    backgroundColor: selected === role.value ? '#F0FDF4' : '#FFF',
                                }}
                            >
                                <View className="flex-row-reverse items-center">
                                    {/* Radio Button */}
                                    <View
                                        className="w-6 h-6 rounded-full border-2 items-center justify-center ml-4"
                                        style={{
                                            borderColor: selected === role.value ? '#065f46' : '#D1D5DB',
                                        }}
                                    >
                                        {selected === role.value && (
                                            <View className="w-3 h-3 rounded-full bg-green-700" />
                                        )}
                                    </View>

                                    <Text
                                        className="text-lg"
                                        style={{
                                            fontFamily: 'Cairo-Regular',
                                            color: selected === role.value ? '#065f46' : '#374151',
                                        }}
                                    >
                                        {role.label}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Action Buttons */}
                    <View className="gap-4 mt-auto">
                        <TouchableOpacity
                            className={`py-4 rounded-xl ${submitting ? 'bg-green-600 opacity-70' : 'bg-green-700'}`}
                            onPress={onSubmit}
                            disabled={submitting || !selected}
                            style={{ opacity: !selected ? 0.5 : 1 }}
                        >
                            <Text
                                className="text-white text-center text-lg font-bold"
                                style={{ fontFamily: 'Cairo-SemiBold' }}
                            >
                                {submitting ? 'جاري الحفظ...' : 'التالي'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="border-2 border-gray-300 py-4 rounded-xl"
                            onPress={() => router.back()}
                        >
                            <Text
                                className="text-gray-700 text-center text-lg font-bold"
                                style={{ fontFamily: 'Cairo-SemiBold' }}
                            >
                                العودة
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}


