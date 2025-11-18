// types/transport.ts

export interface TransportUserSummary {
  userId: number;
  fullName?: string;
  email?: string;
  phone?: string;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface TransportProvider {
  transportProviderId?: number;
  userId: number;
  accountType?: string;
  walletAccount?: string;
  businessLicensePath?: string;
  drivingLicensePath?: string;
  bankAccountNumber?: string;
  iban?: string;
  cardNumber?: string;
  coveredAreas?: string;
  workersAvailable?: number;
  availabilityHours?: string;
  preferredPaymentMethod?: string;
  vehicleImages?: string[];
  estimatedPricePerKm?: number;
  isVerified?: boolean;
  preferredPaymentTerms?: string;
  availabilityDescription?: string;
  user?: TransportUserSummary | null;
  vehicles?: Vehicle[];
}

export interface CreateTransportProviderDto {
  userId: number;
  accountType: string;
  walletAccount: string;
  businessLicensePath: string;
  drivingLicensePath: string;
  bankAccountNumber: string;
  iban: string;
  cardNumber: string;
  coveredAreas: string;
  workersAvailable: number;
  availabilityHours: string;
  preferredPaymentMethod: string;
  vehicleImages: string[];
  estimatedPricePerKm: number;
}

export interface Vehicle {
  transportVehicleId?: number;
  vehicleId?: number;
  providerId?: number;
  vehicleType?: string;
  capacity?: string;
  model?: string;
  vehicleLicensePath?: string;
  vehicleOwnershipProofPath?: string;
  driverLicensesPaths?: string[];
  storageType?: string;
  hasTools?: boolean;
  workersAvailable?: number;
  pricePerKm?: number;
  availabilityHours?: string;
  canProvideLoadingWorkers?: boolean;
  isVerified?: boolean;
  createdAt?: string;
}

export interface CreateVehicleDto {
  providerId: number;
  vehicleType: string;
  capacity: string;
  model: string;
  vehicleLicensePath: string;
  vehicleOwnershipProofPath: string;
  driverLicensesPaths: string[];
  storageType: string;
  hasTools: boolean;
  workersAvailable: number;
  pricePerKm: number;
  availabilityHours: string;
  canProvideLoadingWorkers: boolean;
}

export interface TransportRequest {
  transportRequestId: number;
  orderId: number;
  orderType?: string;
  buyerUserId?: number;
  fromRegion: string;
  toRegion: string;
  distanceKm: number;
  productType: string;
  weightKg: number;
  preferredPickupDate: string;
  preferredDeliveryDate: string;
  specialRequirements: string;
}

export interface CreateTransportRequestDto {
  buyerUserId: number;
  orderId: number;
  orderType: string;
  fromRegion: string;
  toRegion: string;
  distanceKm: number;
  productType: string;
  weightKg: number;
  preferredPickupDate: string;
  preferredDeliveryDate: string;
  specialRequirements: string;
}

export interface TransportOffer {
  offerId: number;
  transportRequestId: number;
  transporterId: number;
  offeredPrice: number;
  estimatedPickupDate: string;
  estimatedDeliveryDate: string;
  notes: string;
  status: string;
}

export interface CreateTransportOfferDto {
  offerId: number;
  transportRequestId: number;
  transporterId: number;
  offeredPrice: number;
  estimatedPickupDate: string;
  estimatedDeliveryDate: string;
  notes: string;
  status: string;
}

export interface TransportPriceRequest {
  fromRegion: string;
  toRegion: string;
  distanceKm: number;
  pricingType: string;
}

export interface NegotiationRequest {
  requestId: number;
  fromRegion: string;
  toRegion: string;
  distanceKm: number;
  productType: string;
  weightKg: number;
}
