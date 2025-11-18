import { clearRegistrationId } from '@/storage/registration-storage';
import { router } from 'expo-router';

export function isExpiredRegistrationError(error: any): boolean {
    const status = error?.status;
    const code = error?.code || error?.response?.error?.code;
    const detail = error?.detail || error?.response?.error?.detail;
    return status === 400 && code === 'invalid_operation' && /expired/i.test(String(detail || ''));
}

export async function handleRegistrationExpiry(): Promise<void> {
    try {
        await clearRegistrationId();
    } catch { }
    router.replace('/registration/step1');
}


