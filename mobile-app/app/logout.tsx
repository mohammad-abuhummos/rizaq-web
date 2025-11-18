import { clearAuth } from '@/storage/auth-storage';
import { clearRegistrationData, clearRegistrationId, clearSelectedRole } from '@/storage/registration-storage';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function LogoutScreen() {
    useEffect(() => {
        const run = async () => {
            await clearAuth();
            await clearRegistrationId();
            await clearSelectedRole();
            await clearRegistrationData();
            router.replace('/login');
        };
        run();
    }, []);

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text>Signing out...</Text>
        </View>
    );
}


