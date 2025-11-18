import { useEffect, useState } from 'react';
import { listCategories, getCategoryById, type CategorySummary, type SubCategory } from '~/lib/services/category';

interface CategoryButtonsProps {
  onCategoryChange?: (categoryId: number | null, keywords: string[]) => void;
}

export function CategoryButtons({ onCategoryChange }: CategoryButtonsProps) {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  const getDisplayName = (nameAr?: string | null, nameEn?: string | null, fallback = 'قسم') => {
    const normalizedAr = typeof nameAr === 'string' ? nameAr.trim() : '';
    if (normalizedAr.length) return normalizedAr;
    const normalizedEn = typeof nameEn === 'string' ? nameEn.trim() : '';
    if (normalizedEn.length) return normalizedEn;
    return fallback;
  };

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await listCategories({ isActive: true });
        const payload = (response as any)?.data ?? response;
        const normalized = Array.isArray(payload) ? payload : [];
        setCategories(normalized);
        if (normalized.length > 0) {
          setSelectedCategoryId(normalized[0].categoryId);
        }
      } catch (err: any) {
        setError(err?.message || 'فشل في تحميل الأقسام');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) {
      setSubCategories([]);
      return;
    }

    const fetchSubCategories = async () => {
      try {
        const response = await getCategoryById(selectedCategoryId);
        const payload = (response as any)?.data ?? response;
        const list = Array.isArray(payload?.subCategories) ? payload.subCategories : [];
        setSubCategories(list);
      } catch (err) {
        setSubCategories([]);
      }
    };

    fetchSubCategories();
  }, [selectedCategoryId]);

  useEffect(() => {
    if (!onCategoryChange) return;
    
    if (selectedCategoryId) {
      const selectedCategory = categories.find((c) => c.categoryId === selectedCategoryId);
      const keywords: string[] = [];
      
      if (selectedCategory) {
        if (selectedCategory.nameAr) keywords.push(selectedCategory.nameAr.trim());
        if (selectedCategory.nameEn) keywords.push(selectedCategory.nameEn.trim());
      }
      
      subCategories.forEach((sub) => {
        if (sub.nameAr) keywords.push(sub.nameAr.trim());
        if (sub.nameEn) keywords.push(sub.nameEn.trim());
      });

      onCategoryChange(selectedCategoryId, keywords);
    } else {
      // Reset to no category when nothing is selected
      onCategoryChange(null, []);
    }
  }, [selectedCategoryId, subCategories, categories, onCategoryChange]);

  const handleCategoryClick = (categoryId: number) => {
    if (categoryId === selectedCategoryId) return;
    setSelectedCategoryId(categoryId);
  };

  if (loading) {
    return (
      <div className="px-4 py-4 border-b border-gray-200 bg-white">
        <div className="flex justify-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-100"></div>
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-green-600 absolute top-0 left-0"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-4 border-b border-gray-200 bg-white">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm text-red-600 border border-red-500 rounded-full hover:bg-red-50"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="px-4 py-4 border-b border-gray-200 bg-white">
        <p className="text-sm text-gray-500 text-center">لا توجد أقسام متاحة حاليًا</p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 pb-2">
      {categories.map((category) => {
        const isSelected = category.categoryId === selectedCategoryId;
        const label = getDisplayName(category.nameAr, category.nameEn);
        return (
          <button
            key={category.categoryId}
            onClick={() => handleCategoryClick(category.categoryId)}
            className={`flex-none rounded-2xl px-6 py-3 text-sm font-bold transition-all duration-300 ${
              isSelected
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg hover:shadow-green-500/30 hover:-translate-y-0.5'
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-green-700 border border-gray-200 hover:border-green-200 shadow-sm hover:shadow-md'
            }`}
          >
            {label || 'قسم'}
          </button>
        );
      })}
    </div>
  );
}

