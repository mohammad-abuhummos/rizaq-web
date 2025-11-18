export interface CreateAuctionDto {
    auctionTitle?: string;
    auctionDescription?: string;
    startingPrice: number;
    minIncrement: number;
    startTime: string; // ISO
    endTime: string; // ISO
    secondEndTime?: string | null; // ISO
    cropId: number;
    /**
     * Optional image URLs associated with this auction.
     * When provided, the backend can link these images directly to the auction.
     */
    imageUrls?: string[] | null;
}

export interface Auction {
    auctionId: number;
    auctionTitle?: string | null;
    auctionDescription?: string | null;
    startingPrice: number;
    minIncrement: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
    createdAt: string;
}

export interface OpenAuction {
    auctionId: number;
    auctionTitle: string;
    auctionDescription: string;
    status: string;
    startTime: string;
    endTime: string;
    secondEndTime: string;
    startingPrice: number;
    minIncrement: number;
    currentPrice: number | null;
    cropId: number;
    sellerUserId?: number;
    maxPrice?: number;
    /**
     * Product main image URL
     */
    productMainImage?: string | null;
    /**
     * Product card color in hex format (e.g., #FF0000)
     */
    productCardColor?: string | null;
    /**
     * Optional images linked directly to the auction (if the API exposes them).
     */
    imageUrls?: string[] | null;
    /**
     * Actual field used by the backend for auction images.
     * (The API returns `images: string[]` in the payload.)
     */
    images?: string[] | null;
}

export interface AuctionDetail {
    auctionId: number;
    auctionTitle: string;
    auctionDescription: string;
    status: string;
    startTime: string;
    endTime: string;
    secondEndTime: string;
    startingPrice: number;
    minIncrement: number;
    currentPrice: number;
    cropId: number;
    /**
     * Optional images linked directly to the auction (if the API exposes them).
     */
    imageUrls?: string[] | null;
    /**
     * Actual field used by the backend for auction images.
     * (The API returns `images: string[]` in the payload.)
     */
    images?: string[] | null;
}

export interface UpdateAuctionDto {
    auctionId: number;
    cropName?: string | null;
    startingPrice?: number | null;
    minIncrement?: number | null;
    startTime?: string | null;
    endTime?: string | null;
    // Optionally support server-side extended fields if accepted
    auctionTitle?: string | null;
    auctionDescription?: string | null;
}


