import { http } from '@/utils/http';

export interface CategoryBase {
    categoryId: number;
    nameAr: string;
    nameEn: string;
    description?: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface CategorySummary extends CategoryBase {
    subCategoriesCount?: number;
}

export interface SubCategory {
    subCategoryId: number;
    nameAr: string;
    nameEn: string;
    isActive: boolean;
    productsCount?: number;
}

export interface CategoryDetail extends CategoryBase {
    subCategories: SubCategory[];
}

interface ListCategoriesParams {
    isActive?: boolean;
}

export function listCategories(params?: ListCategoriesParams) {
    let path = '/api/admin/categories';
    if (params && typeof params.isActive !== 'undefined') {
        const query = new URLSearchParams();
        query.append('isActive', String(params.isActive));
        path = `${path}?${query.toString()}`;
    }
    return http.get<CategorySummary[]>(path);
}

export function getCategoryById(categoryId: number | string) {
    return http.get<CategoryDetail>(`/api/admin/categories/${categoryId}`);
}


