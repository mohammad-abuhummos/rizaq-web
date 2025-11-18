import { http } from '../utils/http';

export interface Product {
    productId: number;
    nameAr: string;
    nameEn: string;
    category: string;
    imageUrl: string;
    description?: string | null;
    isActive: boolean;
}

export function listProducts() {
    return http.get<Product[]>('/api/admin/products', { headers: { Accept: 'text/plain' } });
}

