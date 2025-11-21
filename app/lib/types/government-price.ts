export interface GovernmentPrice {
  governmentPriceId: number;
  productId: number;
  maxPricePerKg: number;
  effectiveFrom: string; // ISO date-time
}

export interface GovernmentPriceWithProduct extends GovernmentPrice {
  productName?: string;
  productImage?: string;
  currentPrice: number;
  previousPrice: number | null;
  percentageChange: number | null;
  priceHistory: number[]; // For sparkline
  latestEffectiveFrom: string;
}

