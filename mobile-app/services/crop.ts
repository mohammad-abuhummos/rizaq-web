import type { CreateCropDto, CropDetail, CropLike } from '@/types/crop';
import { http } from '@/utils/http';

export function createCrop(dto: CreateCropDto) {
    return http.post<any>('/api/crops', dto, { headers: { Accept: 'text/plain' } });
}

export function getCropsByFarm(farmLandId: number) {
    return http.get<CropLike[]>(`/api/crops/by-farmland/${farmLandId}`, { headers: { Accept: 'text/plain' } });
}

export function getCropById(cropId: number) {
    return http.get<CropDetail>(`/api/crops/${cropId}`);
}


