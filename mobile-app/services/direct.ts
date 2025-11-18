import type {
    CancelListingDto,
    CancelOrderDto,
    CreateListingDto,
    CreateOrderDto,
    DirectListing,
    DirectOrder,
    SetListingStatusDto,
    UpdateListingDto,
    UpdateOrderAddressDto,
    UpdateOrderQtyDto,
    UpdateOrderStatusDto,
} from '@/types/direct';
import { http } from '@/utils/http';

// Listings
export function listDirectListings() {
    return http.get<DirectListing[]>('/api/direct/listings');
}

export function getDirectListing(id: number) {
    return http.get<DirectListing>(`/api/direct/listings/${id}`);
}

export function createDirectListing(dto: CreateListingDto) {
    return http.post<any>('/api/direct/listings', dto);
}

export function updateDirectListing(id: number, dto: UpdateListingDto) {
    return http.put<any>(`/api/direct/listings/${id}`, dto);
}

export function setDirectListingStatus(id: number, dto: SetListingStatusDto) {
    return http.post<any>(`/api/direct/listings/${id}/status`, dto);
}

export function cancelDirectListing(id: number, dto: CancelListingDto) {
    return http.post<any>(`/api/direct/listings/${id}/cancel`, dto);
}

// Orders
export function createDirectOrder(dto: CreateOrderDto) {
    return http.post<any>('/api/direct/orders', dto);
}

export function getDirectOrder(id: number) {
    return http.get<DirectOrder>(`/api/direct/orders/${id}`);
}

export function updateDirectOrderStatus(id: number, dto: UpdateOrderStatusDto) {
    return http.post<any>(`/api/direct/orders/${id}/status`, dto);
}

export function updateDirectOrderAddress(id: number, dto: UpdateOrderAddressDto) {
    return http.post<any>(`/api/direct/orders/${id}/address`, dto);
}

export function updateDirectOrderQty(id: number, dto: UpdateOrderQtyDto) {
    return http.post<any>(`/api/direct/orders/${id}/qty`, dto);
}

export function cancelDirectOrder(id: number, dto: CancelOrderDto) {
    return http.post<any>(`/api/direct/orders/${id}/cancel`, dto);
}

export function listBuyerOrders(buyerUserId: number) {
    return http.get<DirectOrder[]>(`/api/direct/buyers/${buyerUserId}/orders`);
}

export function listSellerOrders(sellerUserId: number) {
    return http.get<DirectOrder[]>(`/api/direct/sellers/${sellerUserId}/orders`);
}


