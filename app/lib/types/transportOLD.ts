export interface CreateTransportOfferDto {
    transportRequestId: number;
    transporterId: number;
    offeredPrice: number;
    estimatedPickupDate: string; // ISO string
    estimatedDeliveryDate: string; // ISO string
    notes?: string;
    status?: string; // e.g., 'Pending'
}

export interface TransportOffer {
    offerId: number;
    transportRequestId: number;
    transporterId: number;
    offeredPrice: number;
    estimatedPickupDate: string;
    estimatedDeliveryDate: string;
    notes?: string | null;
    status: string;
    createdAt?: string;
}

export interface AcceptOfferResponse {
    success: boolean;
    message?: string;
}

export interface ListOffersQuery {
    transportRequestId?: number;
    transporterId?: number;
}

// Transport prices
export interface TransportPriceRequestDto {
    fromRegion?: string;
    toRegion?: string;
    distanceKm?: number;
}

export interface NegotiationPriceRequestDto {
    requestId?: number;
    fromRegion?: string;
    toRegion?: string;
    distanceKm?: number;
    productType?: string;
    weightKg?: number;
}

export type TransportRegions = string[];



