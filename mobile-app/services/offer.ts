import type { CreateOfferDto, Offer } from '@/types/offer';
import { http } from '@/utils/http';

export function createOffer(supplierUserId: number | null | undefined, dto: CreateOfferDto) {
    const query = supplierUserId ? `?supplierUserId=${supplierUserId}` : '';
    return http.post<Offer>(`/api/offers${query}`, dto);
}

export function listOffersByTender(tenderId: number) {
    return http.get<Offer[]>(`/api/offers/tender/${tenderId}`);
}


