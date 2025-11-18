// services/transport.ts

import type {
  TransportProvider,
  CreateTransportProviderDto,
  Vehicle,
  CreateVehicleDto,
  TransportRequest,
  CreateTransportRequestDto,
  TransportOffer,
  CreateTransportOfferDto,
  TransportPriceRequest,
  NegotiationRequest,
} from '../types/transport';

import { http } from '../utils/http';

/* ======================================================
   🚚 TRANSPORT PROVIDERS
====================================================== */

export async function createTransportProvider(dto: CreateTransportProviderDto) {
  return http.post<TransportProvider>('/transport', dto);
}

export async function getTransportProviders() {
  return http.get<TransportProvider[]>('/transport');
}

export async function getTransportProviderById(id: number) {
  return http.get<TransportProvider>(`/transport/${id}`);
}

export async function verifyTransportProvider(id: number) {
  return http.put(`/transport/${id}/verify`);
}

export async function getTransportProvidersByArea(area: string) {
  return http.get<TransportProvider[]>(`/transport/area/${area}`);
}

/* ======================================================
   🚗 VEHICLES
====================================================== */

export async function addVehicleToProvider(id: number, dto: CreateVehicleDto) {
  return http.post<Vehicle>(`/transport/${id}/vehicles`, dto);
}

export async function getProviderVehicles(id: number) {
  return http.get<Vehicle[]>(`/transport/${id}/vehicles`);
}

/* ======================================================
   📦 TRANSPORT REQUESTS
====================================================== */

export async function createTransportRequest(dto: CreateTransportRequestDto) {
  return http.post<TransportRequest>('/transport/requests', dto);
}

export async function getTransportRequests() {
  return http.get<TransportRequest[]>('/transport/requests');
}

export async function getTransportRequestById(requestId: number) {
  return http.get<TransportRequest>(`/transport/requests/${requestId}`);
}

export async function notifyTransportRequest(requestId: number) {
  return http.post(`/transport/requests/${requestId}/notify`);
}

/* ======================================================
   💰 TRANSPORT OFFERS
====================================================== */

export async function getOffersForRequest(requestId: number) {
  return http.get<TransportOffer[]>(`/transport/requests/${requestId}/offers`);
}

export async function createTransportOffer(dto: CreateTransportOfferDto) {
  return http.post<TransportOffer>('/transport/offers', dto);
}

export async function acceptTransportOffer(offerId: number) {
  return http.post(`/transport/offers/${offerId}/accept`);
}

/* ======================================================
   💵 TRANSPORT PRICES
====================================================== */

export async function getOfficialTransportPrice(dto: TransportPriceRequest) {
  return http.post('/transport-prices/official', dto);
}

export async function getCheapestTransportPrice(dto: TransportPriceRequest) {
  return http.post('/transport-prices/cheapest', dto);
}

export async function negotiateTransportPrice(dto: NegotiationRequest) {
  return http.post('/transport-prices/negotiation', dto);
}

export async function getTransportRegions() {
  return http.get<string[]>('/transport-prices/regions');
}

