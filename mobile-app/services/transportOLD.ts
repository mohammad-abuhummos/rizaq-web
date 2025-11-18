import type { AcceptOfferResponse, CreateTransportOfferDto, TransportOffer } from '@/types/transportOLD';
import { http } from '@/utils/http';

// Create a transport offer (for buyer or transporter depending on backend semantics)
export function createTransportOffer(dto: CreateTransportOfferDto) {
    return http.post<TransportOffer>('/api/transport/offers', dto);
}

// List transport offers (assumed endpoint with optional filters)
// List offers for a specific transport request (preferred path)
export function listTransportOffersByRequest(requestId: number) {
    return http.get<TransportOffer[]>(`/api/transport/requests/${requestId}/offers`);
}

// Accept a transport offer
export function acceptTransportOffer(offerId: number) {
    return http.post<AcceptOfferResponse>(`/api/transport/offers/${offerId}/accept`);
}


