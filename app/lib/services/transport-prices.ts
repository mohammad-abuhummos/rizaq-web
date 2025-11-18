import type { NegotiationPriceRequestDto, TransportPriceRequestDto, TransportRegions } from '../types/transportOLD';
import { http } from '../utils/http';

export function fetchTransportRegions() {
    return http.get<TransportRegions>('/api/transport-prices/regions');
}

export function getOfficialTransportPrice(dto: TransportPriceRequestDto) {
    return http.post<any>('/api/transport-prices/official', dto);
}

export function getCheapestTransportPrice(dto: TransportPriceRequestDto) {
    return http.post<any>('/api/transport-prices/cheapest', dto);
}

export function startNegotiationTransportPrice(dto: NegotiationPriceRequestDto) {
    return http.post<any>('/api/transport-prices/negotiation', dto);
}

