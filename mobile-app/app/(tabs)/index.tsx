import { BannerCarousel, type Banner } from '@/components/ui/home/BannerCarousel';
import { FloatingActionButton } from '@/components/ui/home/FloatingActionButton';
import { HomeTabs } from '@/components/ui/home/HomeTabs';
import PromoCard from '@/components/ui/home/PromoCard';
import { SearchBar } from '@/components/ui/home/SearchBar';
import ServicesCardContainer from '@/components/ui/home/ServicesCardContainer';
import { useAuthGate } from '@/hooks/useAuthGate';
import { getCategoryById, listCategories, type CategorySummary, type SubCategory } from '@/services/category';
import { getAuthToken } from '@/storage/auth-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const dummyBanners: Banner[] = [
    {
        id: '1',
        image:
            'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=800',
        title: 'أسعار خيال',
        subtitle: 'اشتري او بيع الآن',
        buttonLabel: 'سجل الآن',
    },
    {
        id: '2',
        image:
            'https://images.pexels.com/photos/1487511/pexels-photo-1487511.jpeg?auto=compress&cs=tinysrgb&w=800',
        title: 'مزادات يومية',
        subtitle: 'اشتري او بيع الآن',
        buttonLabel: 'شارك الآن',
    },
    {
        id: '3',
        image:
            'https://images.pexels.com/photos/2733918/pexels-photo-2733918.jpeg?auto=compress&cs=tinysrgb&w=800',
        title: 'منتجات طازجة',
        subtitle: 'اشتري او بيع الآن',
        buttonLabel: 'اطلب الآن',
    },
];

const getDisplayName = (nameAr?: string | null, nameEn?: string | null, fallback = 'قسم') => {
    const normalizedAr = typeof nameAr === 'string' ? nameAr.trim() : '';
    if (normalizedAr.length) return normalizedAr;
    const normalizedEn = typeof nameEn === 'string' ? nameEn.trim() : '';
    if (normalizedEn.length) return normalizedEn;
    return fallback;
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'space-between',
    },
    menuButton: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#1b6b2f',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerButtonGroup: {
        flexDirection: 'row',
        gap: 12,
        flex: 1,
        marginLeft: 12,
    },
    contentContainer: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1b1b1b',
        marginBottom: 16,
        paddingHorizontal: 16,
        marginTop: 16,
    },
    sectionDivider: {
        height: 8,
        backgroundColor: '#f5f5f5',
        marginVertical: 16,
    },
    headerHelperText: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 8,
    },
    categoryButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    categoryButton: {
        flex: 1,
        borderRadius: 18,
        borderWidth: 0,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryButtonSelected: {
        backgroundColor: '#047857',
    },
    categoryFilterCard: {
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#d1fae5',
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    categoryFilterStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
});

export default function HomeScreen() {
    const { withAuth } = useAuthGate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);
    const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
    const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);
    const [subCategoriesError, setSubCategoriesError] = useState<string | null>(null);
    const [subCategoryReloadKey, setSubCategoryReloadKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const selectedCategory = selectedCategoryId
        ? categories.find((category) => category.categoryId === selectedCategoryId) ?? null
        : null;
    const categoryKeywords = useMemo(() => {
        const tokens = new Set<string>();
        const addToken = (value?: string | null) => {
            if (!value) return;
            const trimmed = value.trim();
            if (trimmed.length) {
                tokens.add(trimmed);
            }
        };
        addToken(selectedCategory?.nameAr);
        addToken(selectedCategory?.nameEn);
        subCategories.forEach((subCategory) => {
            addToken(subCategory.nameAr);
            addToken(subCategory.nameEn);
        });
        return Array.from(tokens);
    }, [selectedCategory, subCategories]);
    const categoryFilterState = useMemo(() => ({
        categoryId: selectedCategoryId,
        label: selectedCategory ? getDisplayName(selectedCategory.nameAr, selectedCategory.nameEn) : null,
        keywords: categoryKeywords,
        isActive: !!selectedCategoryId,
        isLoading: subCategoriesLoading,
    }), [selectedCategoryId, selectedCategory, categoryKeywords, subCategoriesLoading]);

    const checkAuth = useCallback(async () => {
        const token = await getAuthToken();
        setIsAuthenticated(!!token);
    }, []);

    useFocusEffect(
        useCallback(() => {
            checkAuth();
            setRefreshKey((prev) => prev + 1);
        }, [checkAuth])
    );

    const handleSearch = (text: string) => {
        setSearchQuery(text);
    };

    const loadCategories = useCallback(async () => {
        setCategoriesLoading(true);
        setCategoriesError(null);
        try {
            const response = await listCategories({ isActive: true });
            const payload = (response as any)?.data ?? response;
            const normalized = Array.isArray(payload) ? payload : [];
            setCategories(normalized);
            setSelectedCategoryId((current) => {
                if (current && normalized.some((category) => category.categoryId === current)) {
                    return current;
                }
                return normalized[0]?.categoryId ?? null;
            });
        } catch (error: any) {
            setCategoriesError(error?.message || 'فشل في تحميل الأقسام');
            setCategories([]);
            setSelectedCategoryId(null);
        } finally {
            setCategoriesLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);


    useEffect(() => {
        if (!selectedCategoryId) {
            setSubCategories([]);
            setSubCategoriesError(null);
            return;
        }

        let cancelled = false;
        const activeCategoryId = selectedCategoryId;
        const fetchSubCategories = async () => {
            setSubCategories([]);
            setSubCategoriesLoading(true);
            setSubCategoriesError(null);
            try {
                const response = await getCategoryById(activeCategoryId);
                const payload = (response as any)?.data ?? response;
                const list = Array.isArray(payload?.subCategories) ? payload.subCategories : [];
                if (!cancelled) {
                    setSubCategories(list);
                }
            } catch (error: any) {
                if (!cancelled) {
                    setSubCategoriesError(error?.message || 'فشل في تحميل الأصناف الفرعية');
                    setSubCategories([]);
                }
            } finally {
                if (!cancelled) {
                    setSubCategoriesLoading(false);
                }
            }
        };

        fetchSubCategories();

        return () => {
            cancelled = true;
        };
    }, [selectedCategoryId, subCategoryReloadKey]);

    const handleCategoryPress = (categoryId: number) => {
        if (categoryId === selectedCategoryId) return;
        setSelectedCategoryId(categoryId);
    };

    const retrySubCategories = () => {
        if (selectedCategoryId) {
            setSubCategoryReloadKey((prev) => prev + 1);
        }
    };

    const handleBannerPress = (bannerId: string) => {
        console.log('Banner pressed:', bannerId);
        // TODO: Navigate to banner details or action
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            {/* Header - category buttons */}
            <View style={styles.header} className="px-10 py-2">
                {categoriesLoading ? (
                    <ActivityIndicator color="#047857" />
                ) : categoriesError ? (
                    <View className="justify-center items-center">
                        <Text className="text-sm text-red-600 font-cairo-semibold">{categoriesError}</Text>
                        <Pressable
                            onPress={loadCategories}
                            className="justify-center items-center px-4 py-2 mt-2 rounded-full border border-red-500">
                            <Text className="text-sm text-red-600 font-cairo-bold">إعادة المحاولة</Text>
                        </Pressable>
                    </View>
                ) : categories.length > 0 ? (
                    <View style={styles.categoryButtonsContainer}>
                        {categories.slice(0, 2).map((category) => {
                            const isSelected = category.categoryId === selectedCategoryId;
                            const label = getDisplayName(category.nameAr, category.nameEn);
                            return (
                                <Pressable
                                    key={category.categoryId}
                                    onPress={() => handleCategoryPress(category.categoryId)}
                                    style={[
                                        styles.categoryButton,
                                        isSelected && styles.categoryButtonSelected,
                                    ]}
                                    android_ripple={{ color: '#d1fae5' }}>
                                    <Text className={`text-base font-cairo-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                        {label || 'قسم'}
                                    </Text>

                                </Pressable>
                            );
                        })}
                    </View>
                ) : (
                    <Text className="text-sm text-gray-500 font-cairo-semibold">لا توجد أقسام متاحة حاليًا</Text>
                )}
            </View>

            {/* Main Content */}
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Search Bar */}
                <SearchBar
                    onSearch={handleSearch}
                    placeholder="ابحث عن الصنف"
                    onSearchPress={withAuth(() => console.log('Search button pressed'))}
                />

                {/* {selectedCategory ? (
                    <View style={styles.categoryFilterCard}>
                        <Text className="text-base text-emerald-900 font-cairo-bold">
                            {`نعرض الآن المحتوى الخاص بـ ${getDisplayName(selectedCategory.nameAr, selectedCategory.nameEn, 'هذا القسم')}`}
                        </Text>
                        <Text className="mt-1 text-sm text-gray-600 font-cairo">
                            المزادات والبيع المباشر ستظهر فقط إذا احتوت أسماؤها على كلمات من هذا القسم.
                        </Text>
                        <View
                            style={[
                                styles.categoryFilterStatus,
                                subCategoriesLoading ? { justifyContent: 'flex-start' } : undefined,
                            ]}>
                            {subCategoriesLoading ? (
                                <View className="flex-row gap-2 items-center">
                                    <ActivityIndicator color="#047857" size="small" />
                                    <Text className="text-sm text-emerald-700 font-cairo-semibold">
                                        يتم تحديث الكلمات المفتاحية...
                                    </Text>
                                </View>
                            ) : subCategoriesError ? (
                                <>
                                    <Text className="flex-1 text-sm text-red-600 font-cairo-semibold">
                                        لم نتمكن من جلب أصناف هذا القسم
                                    </Text>
                                    <Pressable
                                        onPress={retrySubCategories}
                                        className="px-3 py-2 bg-red-50 rounded-full border border-red-500">
                                        <Text className="text-xs text-red-600 font-cairo-bold">إعادة المزامنة</Text>
                                    </Pressable>
                                </>
                            ) : (
                                <Text className="text-sm text-emerald-700 font-cairo-semibold">
                                    {categoryKeywords.length
                                        ? `${categoryKeywords.length} كلمات مفتاحية مفعّلة`
                                        : 'جارٍ التصفية باسم القسم'}
                                </Text>
                            )}
                        </View>
                    </View>
                ) : null} */}

                {/* Banner Carousel */}
                <BannerCarousel
                    data={dummyBanners}
                    onBannerPress={withAuth(handleBannerPress)}
                />

                {/* Section Tabs */}
                <HomeTabs
                    refreshKey={refreshKey}
                    categoryFilter={categoryFilterState}
                    searchQuery={searchQuery}
                />

                {/* Services Section */}
                <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                    <ServicesCardContainer />
                </View>

                <PromoCard />



                {/* Divider */}
                <View style={styles.sectionDivider} />


            </ScrollView>

            {/* Floating Action Button - Only show when authenticated */}
            {isAuthenticated && <FloatingActionButton />}
        </SafeAreaView>
    );
}
