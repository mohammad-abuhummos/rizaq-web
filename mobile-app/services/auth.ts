import { getAuthToken, getAuthUser, saveAuthToken, saveAuthUser, saveUserRoleName } from '@/storage/auth-storage';
import type { ProfileMe, UserTypeInfo } from '@/types/profile';
import { http } from '@/utils/http';

export interface LoginDto {
    emailOrPhone: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user?: any;
}

export async function login(dto: LoginDto) {
    const res = await http.post<LoginResponse>('/api/auth/login', dto);
    // Handle nested API response shape per logs: { data: { data: { accessToken, refreshToken, ... }, message, success } }
    const innerData = (res as any)?.data?.data || (res as any)?.data || (res as any);
    const token = innerData?.accessToken || innerData?.token;
    if (token) await saveAuthToken(token);
    const user = innerData?.user || {
        fullName: innerData?.fullName,
        userId: innerData?.userId,
        expiresAt: innerData?.expiresAt,
    };
    if (user) await saveAuthUser(user);
    // Fetch and persist current user's role name after successful authentication
    try {
        const userIdForRole = user?.userId ?? user?.id;
        const userType = await getCurrentUserType(userIdForRole);
        if (userType?.roleName) {
            await saveUserRoleName(userType.roleName);
        }
    } catch {
        // Non-fatal: ignore if UserType fetch fails
    }
    return res;
}

export async function me(token?: string) {
    const t = token || (await getAuthToken());
    if (t) {
        return http.get<any>(`/api/auth/me?token=${encodeURIComponent(t)}`);
    }
    return http.get<any>('/api/auth/me');
}

// Fetch authenticated user's profile
export async function getMyProfile() {
    // API returns nested { success, data: { success, data: ProfileMe } }
    const res = await http.get<{ success: boolean; data: ProfileMe } | ProfileMe>('/api/profile/me');
    const inner = (res as any)?.data?.data || (res as any)?.data || (res as any);
    return inner as ProfileMe;
}

// Fetch current user's type (role) and return normalized data
// If userId is omitted, it will be resolved from auth storage or profile API.
export async function getCurrentUserType(userId?: number | string): Promise<UserTypeInfo> {
    let effectiveUserId: number | string | undefined = userId;

    // 1) Try explicit argument
    if (!effectiveUserId) {
        // 2) Try auth user from storage
        const authUser = await getAuthUser<{ userId?: number | string; id?: number | string }>();
        effectiveUserId = authUser?.userId ?? authUser?.id;
    }

    // 3) Fallback to profile API if still missing
    if (!effectiveUserId) {
        try {
            const profile = await getMyProfile();
            effectiveUserId = profile?.userId;
        } catch {
            // ignore and error below if we still don't have an id
        }
    }

    if (!effectiveUserId) {
        throw new Error('No userId available to fetch user type');
    }

    const res = await http.get<UserTypeInfo>(`/api/profile/UserType/${effectiveUserId}`, {
        headers: { accept: '*/*' },
    });
    const inner = (res as any)?.data?.data || (res as any)?.data || (res as any);
    return inner as UserTypeInfo;
}


