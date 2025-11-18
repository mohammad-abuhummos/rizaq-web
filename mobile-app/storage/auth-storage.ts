import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';
const AUTH_ROLE_NAME_KEY = 'auth_role_name';

export async function saveAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function getAuthToken(): Promise<string | null> {
    return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function clearAuthToken(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function saveAuthUser(data: any): Promise<void> {
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data));
}

export async function getAuthUser<T = any>(): Promise<T | null> {
    const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export async function clearAuthUser(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_USER_KEY);
}

export async function clearAuth(): Promise<void> {
    await Promise.all([clearAuthToken(), clearAuthUser(), clearUserRoleName()]);
}

export async function saveUserRoleName(roleName: string): Promise<void> {
    await AsyncStorage.setItem(AUTH_ROLE_NAME_KEY, roleName);
}

export async function getUserRoleName(): Promise<string | null> {
    return AsyncStorage.getItem(AUTH_ROLE_NAME_KEY);
}

export async function clearUserRoleName(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_ROLE_NAME_KEY);
}


