export interface CreateFarmDto {
    name?: string | null;
    country?: string | null;
    governorate?: string | null;
    city?: string | null;
    village?: string | null;
    street?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    area?: string | null;
    district?: string | null;
    canStoreAfterHarvest: boolean;
    landOwnershipType?: string | null;
}

export interface UpdateFarmDto {
    name?: string | null;
    country?: string | null;
    governorate?: string | null;
    city?: string | null;
    village?: string | null;
    street?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    area?: string | null;
    district?: string | null;
    canStoreAfterHarvest: boolean;
    landOwnershipType?: string | null;
}

export interface Farm {
    farmId: number;
    userId: number;
    user: any | null;
    name: string;
    country: string | null;
    governorate: string | null;
    city: string | null;
    village: string | null;
    street: string | null;
    latitude: number;
    longitude: number;
    area: string | null;
    isActive: boolean;
    canStoreAfterHarvest: boolean;
    createdAt: string;
    updatedAt: string | null;
    landOwnershipType: string | null;
    farmerId: number;
}

// Legacy interface - keep for backwards compatibility
export interface FarmLike {
    farmLandId?: number;
    id?: number;
    farmId?: number;
    name?: string;
    country?: string | null;
    city?: string | null;
}


