import { getAuthToken } from '@/storage/auth-storage';
import { router } from 'expo-router';
import { useCallback } from 'react';

/**
 * Provides helpers to guard press handlers and navigations behind authentication.
 * If no token is present, navigates to /login; otherwise, runs the original action.
 */
export function useAuthGate() {
    const ensureAuth = useCallback(async (onAuthenticated?: () => void) => {
        try {
            const token = await getAuthToken();
            if (!token) {
                router.push('/login');
                return;
            }
            onAuthenticated?.();
        } catch {
            router.push('/login');
        }
    }, []);

    // Wrap any handler with auth requirement, preserving arguments
    const withAuth = useCallback(<T extends any[]>(fn?: (...args: T) => void) => {
        return async (...args: T) => {
            await ensureAuth(() => fn?.(...args));
        };
    }, [ensureAuth]);

    // Prepares a guarded navigation to a specific route
    const navigateGuarded = useCallback((href: string) => {
        return async () => {
            await ensureAuth(() => router.push(href));
        };
    }, [ensureAuth]);

    return { ensureAuth, withAuth, navigateGuarded };
}


