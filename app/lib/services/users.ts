import type { ProfileMe } from '../types/profile';
import { http } from '../utils/http';

export function getUserById(userId: number) {
    return http.get<ProfileMe>(`/api/users/${userId}`);
}

