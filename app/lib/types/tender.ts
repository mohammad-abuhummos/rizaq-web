export interface Tender {
    tenderId: number;
    title?: string | null;
    description?: string | null;
    productId?: number | null;
    cropName?: string | null;
    quantity?: number | null;
    unit?: string | null;
    maxBudget?: number | null;
    deliveryFrom?: string | null; // ISO date-time
    deliveryTo?: string | null;   // ISO date-time
    deliveryLocation?: string | null;
    startTime?: string | null;    // ISO date-time
    endTime?: string | null;      // ISO date-time
    status?: string | null;
    productMainImage?: string | null;
    productCardColor?: string | null;
    images?: string[] | null;
}

export interface CreateTenderDto {
    title?: string | null;
    description?: string | null;
    productId: number;
    cropName?: string | null;
    quantity: number;
    unit?: string | null;
    maxBudget?: number | null;
    deliveryFrom: string; // ISO date-time
    deliveryTo: string;   // ISO date-time
    deliveryLocation?: string | null;
    startTime: string;    // ISO date-time
    endTime: string;      // ISO date-time
}


