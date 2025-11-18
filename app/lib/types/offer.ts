export interface Offer {
    offerId: number;
    tenderId: number;
    // API returns offeredPrice; some endpoints may echo price
    offeredPrice?: number;
    price?: number;
    quantityOffered?: number;
    status?: string | null;
    description?: string | null;
    supplierUserId?: number | null;
    createdAt?: string | null;
}

export interface CreateOfferDto {
    tenderId: number;
    price: number;
    description?: string | null;
}


