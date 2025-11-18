import type { UserRole } from '../types/registration';

const REG_ID_KEY = 'registrationId';
const REG_DATA_KEY = 'registration_data';
const REG_ROLE_KEY = 'registration_selected_role';

export async function saveRegistrationId(registrationId: string): Promise<void> {
    localStorage.setItem(REG_ID_KEY, registrationId);
}

export async function getRegistrationId(): Promise<string | null> {
    return localStorage.getItem(REG_ID_KEY);
}

export async function clearRegistrationId(): Promise<void> {
    localStorage.removeItem(REG_ID_KEY);
    localStorage.removeItem(REG_ROLE_KEY);
}

export async function saveRegistrationData(data: unknown): Promise<void> {
    localStorage.setItem(REG_DATA_KEY, JSON.stringify(data));
}

export async function getRegistrationData<T = any>(): Promise<T | null> {
    const raw = localStorage.getItem(REG_DATA_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export async function clearRegistrationData(): Promise<void> {
    localStorage.removeItem(REG_DATA_KEY);
}

export async function saveSelectedRole(role: UserRole): Promise<void> {
    localStorage.setItem(REG_ROLE_KEY, role);
}

export async function getSelectedRole(): Promise<UserRole | null> {
    const value = localStorage.getItem(REG_ROLE_KEY);
    return (value as UserRole | null) ?? null;
}

export async function clearSelectedRole(): Promise<void> {
    localStorage.removeItem(REG_ROLE_KEY);
}

