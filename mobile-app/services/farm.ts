import type { CreateFarmDto, Farm, UpdateFarmDto } from '@/types/farm';
import { http } from '@/utils/http';

export function createFarm(userId: number, dto: CreateFarmDto) {
    const query = userId ? `?userId=${userId}` : '';
    return http.post<Farm>(`/api/farms${query}`, dto);
}

export function listFarmsByUser(userId: number) {
    return http.get<Farm[]>(`/api/farms/by-user/${userId}`);
}

export function getFarmById(farmId: number) {
    return http.get<Farm>(`/api/farms/${farmId}`);
}

export function updateFarm(farmId: number, userId: number, dto: UpdateFarmDto) {
    const query = userId ? `?userId=${userId}` : '';
    return http.put<Farm>(`/api/farms/${farmId}${query}`, dto);
}

export function deleteFarm(farmId: number, userId: number) {
    const query = userId ? `?userId=${userId}` : '';
    return http.delete<void>(`/api/farms/${farmId}${query}`);
}


