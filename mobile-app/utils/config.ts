import Constants from 'expo-constants';

export function getApiBaseUrl(): string {
    // Prefer EXPO_PUBLIC_API_URL first (per requirement), then EXPO_PUBLIC_API_BASE_URL, then app.json extra, then default
    const envPrimary = process.env.EXPO_PUBLIC_API_URL;
    const envLegacy = process.env.EXPO_PUBLIC_API_BASE_URL;
    const extra = (Constants.expoConfig as any)?.extra?.API_BASE_URL as string | undefined;
    return (envPrimary || envLegacy || extra || 'https://alhal.awnak.net').replace(/\/$/, '');
}

export function isDevelopment(): boolean {
    return typeof __DEV__ !== 'undefined' ? __DEV__ : true;
}


