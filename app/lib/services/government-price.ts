import { http } from '../utils/http';
import type { GovernmentPrice, GovernmentPriceWithProduct } from '../types/government-price';
import type { Product } from './product';
import { listProducts } from './product';

export interface GovernmentPriceResponse {
  success: boolean;
  data: GovernmentPrice[];
  message?: string;
  traceId?: string;
}

/**
 * Fetch all government prices from the API
 */
export async function getGovernmentPrices(): Promise<GovernmentPrice[]> {
  const response = await http.get<GovernmentPriceResponse>('/api/admin/prices');
  
  // Handle nested response structure
  const data = (response as any)?.data?.data || (response as any)?.data || response;
  return Array.isArray(data) ? data : [];
}

/**
 * Process government prices to get the latest prices with percentage changes
 * Groups by productId, sorts by date, calculates changes, and returns top 3
 */
export async function getLatestGovernmentPricesWithChanges(): Promise<GovernmentPriceWithProduct[]> {
  // Fetch both prices and products
  const [prices, productsRes] = await Promise.all([
    getGovernmentPrices().catch(() => []),
    listProducts().catch(() => ({ data: [] }))
  ]);

  const products: Product[] = Array.isArray((productsRes as any)?.data) 
    ? (productsRes as any).data 
    : Array.isArray(productsRes) 
    ? productsRes 
    : [];

  // Create a map for quick product lookup
  const productMap = new Map<number, Product>();
  products.forEach(p => productMap.set(p.productId, p));

  // Group prices by productId
  const pricesByProduct = new Map<number, GovernmentPrice[]>();
  
  prices.forEach(price => {
    if (!pricesByProduct.has(price.productId)) {
      pricesByProduct.set(price.productId, []);
    }
    pricesByProduct.get(price.productId)!.push(price);
  });

  // Process each product group
  const processedPrices: GovernmentPriceWithProduct[] = [];

  pricesByProduct.forEach((productPrices, productId) => {
    // Sort by effectiveFrom descending (latest first)
    productPrices.sort((a, b) => 
      new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
    );

    const latestPrice = productPrices[0];
    const previousPrice = productPrices.length > 1 ? productPrices[1] : null;

    // Calculate percentage change
    let percentageChange: number | null = null;
    if (previousPrice && previousPrice.maxPricePerKg > 0) {
      percentageChange = ((latestPrice.maxPricePerKg - previousPrice.maxPricePerKg) / previousPrice.maxPricePerKg) * 100;
    }

    // Get price history for sparkline (reverse to show chronological order)
    const priceHistory = [...productPrices].reverse().map(p => p.maxPricePerKg);

    // Get product info
    const product = productMap.get(productId);

    processedPrices.push({
      ...latestPrice,
      currentPrice: latestPrice.maxPricePerKg,
      previousPrice: previousPrice?.maxPricePerKg || null,
      percentageChange,
      priceHistory,
      latestEffectiveFrom: latestPrice.effectiveFrom,
      productName: product?.nameAr || product?.nameEn || `منتج #${productId}`,
      productImage: product?.imageUrl || undefined,
    });
  });

  // Sort by latestEffectiveFrom descending and get top 3
  processedPrices.sort((a, b) => 
    new Date(b.latestEffectiveFrom).getTime() - new Date(a.latestEffectiveFrom).getTime()
  );

  return processedPrices.slice(0, 3);
}

