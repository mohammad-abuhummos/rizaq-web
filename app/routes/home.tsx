import type { Route } from "./+types/home";
import { useState, useCallback } from "react";
import { Header } from "../components/Header";
import { BannerCarousel, type Banner } from "../components/home/BannerCarousel";
import { SearchBar } from "../components/home/SearchBar";
import { CategoryButtons } from "../components/home/CategoryButtons";
import { HomeTabs } from "../components/home/HomeTabs";
import { ServicesCardContainer } from "../components/home/ServicesCardContainer";
import { PromoCard } from "../components/home/PromoCard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Rizaq - Agricultural Marketplace" },
    {
      name: "description",
      content: "Connect farmers, traders, and transporters in one platform",
    },
  ];
}

const dummyBanners: Banner[] = [
  {
    id: "1",
    image:
      "https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "أسعار خيال",
    subtitle: "اشتري او بيع الآن",
    buttonLabel: "سجل الآن",
  },
  {
    id: "2",
    image:
      "https://images.pexels.com/photos/1487511/pexels-photo-1487511.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "مزادات يومية",
    subtitle: "اشتري او بيع الآن",
    buttonLabel: "شارك الآن",
  },
  {
    id: "3",
    image:
      "https://images.pexels.com/photos/2733918/pexels-photo-2733918.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "منتجات طازجة",
    subtitle: "اشتري او بيع الآن",
    buttonLabel: "اطلب الآن",
  },
];

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<{
    categoryId: number | null;
    keywords: string[];
    isActive: boolean;
  }>({
    categoryId: null,
    keywords: [],
    isActive: false,
  });

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleCategoryChange = useCallback((categoryId: number | null, keywords: string[]) => {
    setCategoryFilter({
      categoryId,
      keywords,
      isActive: !!categoryId,
    });
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleBannerPress = (bannerId: string) => {
    console.log("Banner pressed:", bannerId);
    // TODO: Navigate to banner details or action
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Category Buttons Header */}
      <CategoryButtons onCategoryChange={handleCategoryChange} />

      {/* Main Content */}
      <div className="pb-8">
        {/* Search Bar */}
        <SearchBar
          onSearch={handleSearch}
          placeholder="ابحث عن الصنف"
          onSearchPress={() => console.log("Search button pressed")}
        />

        {/* Banner Carousel */}
        <BannerCarousel data={dummyBanners} onBannerPress={handleBannerPress} />

        {/* Section Tabs */}
        <HomeTabs
          refreshKey={refreshKey}
          categoryFilter={categoryFilter}
          searchQuery={searchQuery}
        />

        {/* Services Section */}
        <ServicesCardContainer />

        {/* Promo Card */}
        <PromoCard />

        {/* Divider */}
        <div className="h-2 bg-gray-100 my-4" />
      </div>
    </div>
  );
}
