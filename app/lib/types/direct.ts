export interface DirectListing {
    listingId: number;
    sellerUserId: number;
    title?: string | null;
    cropName?: string | null;
    unit?: string | null;
    unitPrice: number;
    availableQty: number;
    minOrderQty: number;
    maxOrderQty?: number | null;
    location?: string | null;
    status?: string | null;
}

export interface CreateListingDto {
    sellerUserId: number;
    title?: string | null;
    cropName?: string | null;
    unit?: string | null;
    unitPrice: number;
    availableQty: number;
    minOrderQty: number;
    maxOrderQty?: number | null;
    location?: string | null;
}

export interface UpdateListingDto {
    listingId: number;
    title?: string | null;
    cropName?: string | null;
    unit?: string | null;
    unitPrice?: number | null;
    availableQty?: number | null;
    minOrderQty?: number | null;
    maxOrderQty?: number | null;
    location?: string | null;
}

export interface SetListingStatusDto {
    listingId: number;
    newStatus?: string | null;
}

export interface CancelListingDto {
    listingId: number;
    requestedByUserId: number;
    reason?: string | null;
}

export interface DirectOrder {
    orderId: number;
    listingId: number;
    buyerUserId: number;
    sellerUserId?: number;
    qty: number;
    status?: string | null;
    deliveryAddress?: string | null;
    paymentMethod?: string | null;
    subtotal?: number | null;
    deliveryFee?: number | null;
    total?: number | null;
    createdAt?: string | null;
}

export interface CreateOrderDto {
    listingId: number;
    buyerUserId: number;
    qty: number;
    deliveryAddress?: string | null;
    paymentMethod?: string | null;
}

export interface UpdateOrderStatusDto {
    orderId: number;
    newStatus?: string | null;
}

export interface UpdateOrderAddressDto {
    orderId: number;
    deliveryAddress?: string | null;
    paymentMethod?: string | null;
}

export interface UpdateOrderQtyDto {
    orderId: number;
    newQty: number;
}

export interface CancelOrderDto {
    orderId: number;
    requestedByUserId: number;
    reason?: string | null;
}


