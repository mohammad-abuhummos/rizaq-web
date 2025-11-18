export function getApiBaseUrl(): string {
    // Prefer VITE_API_URL first, then VITE_API_BASE_URL, then default
    const envPrimary = import.meta.env.VITE_API_URL;
    const envLegacy = import.meta.env.VITE_API_BASE_URL;
    return (envPrimary || envLegacy || 'https://alhal.awnak.net').replace(/\/$/, '');
}

export function isDevelopment(): boolean {
    return import.meta.env.DEV;
}

