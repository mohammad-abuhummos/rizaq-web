import { getRegistrationStatus, startRegistration } from '@/services/registration';
import { clearRegistrationId, getRegistrationId, saveRegistrationId } from '@/storage/registration-storage';
import type { RegistrationStatusData, StartRegistrationData } from '@/types/registration';
import { useCallback, useState } from 'react';

interface UseRegistrationSessionResult {
    registrationId: string | null;
    status: RegistrationStatusData | null;
    loading: boolean;
    error: Error | null;
    startOrResume: () => Promise<void>;
    refresh: () => Promise<void>;
}

export function useRegistrationSession(): UseRegistrationSessionResult {
    const [registrationId, setRegistrationId] = useState<string | null>(null);
    const [status, setStatus] = useState<RegistrationStatusData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const loadStatus = useCallback(async (id: string): Promise<RegistrationStatusData> => {
        const res = await getRegistrationStatus(id);
        setStatus(res.data);
        return res.data;
    }, []);

    const startOrResume = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const existingId = await getRegistrationId();
            let shouldStartNew = true;

            if (existingId) {
                setRegistrationId(existingId);
                try {
                    const existingStatus = await loadStatus(existingId);
                    const isCompletedOrExpired =
                        existingStatus?.isCompleted ||
                        existingStatus?.expired ||
                        existingStatus?.currentStep >= 7;

                    if (!isCompletedOrExpired) {
                        // Active in-progress session: just resume it.
                        shouldStartNew = false;
                    } else {
                        // Completed or expired session: clear and start a fresh one.
                        await clearRegistrationId();
                    }
                } catch (e: any) {
                    // If status endpoint says the registration doesn't exist anymore, clear and start fresh.
                    if (e?.status === 404) {
                        await clearRegistrationId();
                    } else {
                        throw e;
                    }
                }
            }

            if (!shouldStartNew) {
                return;
            }

            const res = await startRegistration();
            const data: StartRegistrationData = res.data;
            await saveRegistrationId(data.registrationId);
            setRegistrationId(data.registrationId);
            setStatus({
                registrationId: data.registrationId,
                currentStep: data.currentStep,
                roleName: null,
            });
        } catch (e: any) {
            setError(e);
        } finally {
            setLoading(false);
        }
    }, [loadStatus]);

    const refresh = useCallback(async () => {
        if (!registrationId) return;
        setLoading(true);
        setError(null);
        try {
            await loadStatus(registrationId);
        } catch (e: any) {
            setError(e);
        } finally {
            setLoading(false);
        }
    }, [registrationId, loadStatus]);

    // Note: no auto-start here to prevent duplicate fetches across screens.

    return { registrationId, status, loading, error, startOrResume, refresh };
}


