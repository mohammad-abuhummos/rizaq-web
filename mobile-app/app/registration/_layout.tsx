import { Stack, usePathname } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ProgressStepper() {
    const pathname = usePathname();
    const insets = useSafeAreaInsets();

    // Define steps with their routes
    const steps = [
        { route: '/registration/step1', step: 1 },
        { route: '/registration/otp', step: 2 },
        { route: '/registration/role', step: 3 },
        { route: '/registration/details', step: 4 },
        { route: '/registration/documents', step: 5 },
        { route: '/registration/payout', step: 6 },
    ];

    const currentStepIndex = steps.findIndex((s) => pathname === s.route);
    const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 0;

    // Don't show stepper on index page
    if (pathname === '/registration' || pathname === '/registration/index') {
        return null;
    }

    return (
        <View
            className="bg-white px-6 pb-4 "
            style={{ paddingTop: insets.top + 8 }}
        >
            <View className="flex-row items-center justify-center gap-2">
                {steps.map((_, index) => {
                    const stepNum = index + 1;
                    const isActive = stepNum === currentStep;
                    const isCompleted = stepNum < currentStep;

                    return (
                        <React.Fragment key={index}>
                            <View
                                className={`h-2 flex-1 rounded-full ${isCompleted || isActive ? 'bg-green-700' : 'bg-gray-300'
                                    }`}
                            />
                            {index < steps.length - 1 && (
                                <View className="w-1" />
                            )}
                        </React.Fragment>
                    );
                })}
            </View>
        </View>
    );
}

export default function RegistrationLayout() {
    return (
        <>
            <ProgressStepper />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="step1" />
                <Stack.Screen name="otp" />
                <Stack.Screen name="role" />
                <Stack.Screen name="details" />
                <Stack.Screen name="documents" />
                <Stack.Screen name="payout" />
            </Stack>
        </>
    );
}


