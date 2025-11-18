export interface CreateCropDto {
    farmId: number;
    productId: number;
    name?: string | null;
    variety?: string | null;
    quantity: number;
    unit?: string | null;
    harvestDate: string; // ISO
    expiryDate?: string | null; // ISO
    qualityGrade?: string | null;
    size?: string | null;
    color?: string | null;
    packingMethod?: string | null;
    supplyScope?: string | null;
    imageUrls?: string[] | null;
}

export interface CropLike {
    cropId?: number;
    id?: number;
    name?: string;
    productId?: number;
}

export interface CropDetail {
    cropId: number;
    productId: number;
    name: string;
    variety: string;
    quantity: number;
    unit: string;
    harvestDate: string;
    expiryDate: string | null;
    qualityGrade: string;
    size: string;
    color: string;
    packingMethod: string;
    supplyScope: string;
    images: string[];
}


