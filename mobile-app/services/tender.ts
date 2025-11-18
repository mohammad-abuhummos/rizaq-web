import type { CreateTenderDto, Tender } from '@/types/tender';
import { http } from '@/utils/http';

export function listOpenTenders() {
    return http.get<Tender[]>('/api/tenders/open');
}

export function getTender(id: number) {
    return http.get<Tender>(`/api/tenders/${id}`);
}

export function createTender(createdByUserId: number | null | undefined, dto: CreateTenderDto) {
    const query = createdByUserId ? `?createdByUserId=${createdByUserId}` : '';
    return http.post<Tender>(`/api/tenders${query}`, dto);
}

export function cancelTender(id: number) {
    return http.post<any>(`/api/tenders/${id}/cancel`);
}

export function awardTender(id: number, offerId: number) {
    return http.post<any>(`/api/tenders/${id}/award/${offerId}`);
}


// List tenders that the specified user has joined
export function listJoinedTendersByUser(userId: number) {
    return http.get<Tender[]>(`/api/tenders/joined/by-user/${userId}`);
}

// List tenders created by a specific user
export function listTendersCreatedByUser(userId: number) {
    return http.get<Tender[]>(`/api/tenders/userId/${userId}`);
}


