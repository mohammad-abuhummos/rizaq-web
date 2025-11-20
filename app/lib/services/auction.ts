import type { Auction, AuctionDetail, CreateAuctionDto, OpenAuction, UpdateAuctionDto } from '../types/auction';
import { http } from '../utils/http';

export async function createAuction(createdByUserId: number, dto: CreateAuctionDto) {
    const query = createdByUserId ? `?createdByUserId=${createdByUserId}` : '';
    return http.post<Auction>(`/api/auctions${query}`, dto, {
        headers: { Accept: 'text/plain' },
    });
}

export async function getOpenAuctions(page?: number, pageSize?: number) {
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', page.toString());
    if (pageSize !== undefined) params.append('pageSize', pageSize.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return http.get<OpenAuction[]>(`/api/auctions/open${query}`);
}

export async function getOpenAuctionsPaginated(page: number = 1, pageSize: number = 9) {
    const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
    });
    
    return http.get<{
        items: OpenAuction[];
        totalCount: number;
        currentPage: number;
        pageSize: number;
        totalPages: number;
    }>(`/api/auctions/open?${params.toString()}`);
}

export async function getAuctionById(auctionId: number) {
    return http.get<AuctionDetail>(`/api/auctions/${auctionId}`);
}

// List auctions that the specified user has joined
export async function listJoinedAuctionsByUser(userId: number) {
    return http.get<OpenAuction[]>(`/api/auctions/joined/by-user/${userId}`);
}

// List auctions created by the specified user
export async function listAuctionsCreatedByUser(userId: number) {
    return http.get<OpenAuction[]>(`/api/auctions/by-user/${userId}`);
}

// Update auction (owner only)
export async function updateAuction(auctionId: number, dto: UpdateAuctionDto) {
    return http.put<any>(`/api/auctions/${auctionId}`, dto);
}



export async function listBidsByAuctionId(auctionId: number) {
  console.log("📤 Fetching bids for auction:", auctionId);
  return http.get<any[]>(`/api/auctions/bids/${auctionId}`);
}

