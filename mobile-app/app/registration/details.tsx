import { FarmerForm } from '@/components/registration/FarmerForm';
import { TraderForm } from '@/components/registration/TraderForm';
import { TransporterForm } from '@/components/registration/TransporterForm';
import { getRegistrationId, getSelectedRole } from '@/storage/registration-storage';
import type { UserRole } from '@/types/registration';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const ROLE_TITLES = {
    farmer: 'بيانات المزارع',
    trader: 'بيانات التاجر',
    transporter: 'بيانات الناقل',
};

export default function DetailsScreen() {
    const [registrationId, setRegistrationId] = useState<string | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);

    useEffect(() => {
        getRegistrationId().then(setRegistrationId);
        getSelectedRole().then(setRole);
    }, []);

    if (!role) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 bg-white items-center justify-center">
                    <ActivityIndicator size="large" color="#065f46" />
                    <Text className="mt-4 text-gray-600 text-lg" style={{ fontFamily: 'Cairo-Regular' }}>
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
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
                    {/* Header */}
                    <View className="flex-row-reverse items-center justify-end mb-8 mt-12">
                        <Text
                            className="text-2xl font-bold text-gray-900 text-left"
                            style={{ fontFamily: 'Cairo-Bold' }}
                        >
                            {ROLE_TITLES[role]}
                        </Text>
                        <TouchableOpacity onPress={() => router.back()} className="mr-2">
                            <Ionicons name="arrow-forward" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {role === 'farmer' && registrationId && <FarmerForm registrationId={registrationId} />}
                    {role === 'trader' && registrationId && <TraderForm registrationId={registrationId} />}
                    {role === 'transporter' && registrationId && <TransporterForm registrationId={registrationId} />}
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}


