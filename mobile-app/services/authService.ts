// services/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { http } from "@/utils/http";
import type { User } from "@/types/user";

/* ======================================================
   🔑 TYPES
====================================================== */

export interface LoginCredentials {
  emailOrPhone: string;
  password: string;
}

export interface RegisterDto {
  fullName?: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface LoginApiEnvelope {
  success: boolean;
  data: {
    success: boolean;
    traceId?: string;
    data: {
      userId: number;
      fullName: string;
      accessToken: string;
      refreshToken: string;
      expiresAt: string; // ISO
    };
    message?: string;
  };
  message?: string | null;
  meta?: unknown;
  traceId?: string;
  error?: unknown;
}

/* ======================================================
   🗝️ STORAGE KEYS
====================================================== */

const AUTH_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const TOKEN_EXPIRES_AT_KEY = "token_expires_at";
const USER_DATA_KEY = "user_data";

/* ======================================================
   🔐 AUTH SERVICES
====================================================== */

/** Login */
export async function login(dto: LoginCredentials) {
  const res = await http.post<LoginApiEnvelope>("/auth/login", dto);
  const payload = res?.data?.data;
  if (!payload?.accessToken) {
    throw new Error("Invalid login response");
  }

  const user: User = {
    id: String(payload.userId),
    email: dto.emailOrPhone.includes("@") ? dto.emailOrPhone : "",
    phone: dto.emailOrPhone.includes("@") ? undefined : dto.emailOrPhone,
    role: "",
    name: payload.fullName,
  };

  await AsyncStorage.multiSet([
    [AUTH_TOKEN_KEY, payload.accessToken],
    [REFRESH_TOKEN_KEY, payload.refreshToken ?? ""],
    [TOKEN_EXPIRES_AT_KEY, payload.expiresAt ?? ""],
    [USER_DATA_KEY, JSON.stringify(user)],
  ]);

  return user;
}

/** Register then auto-login */
export async function register(dto: RegisterDto) {
  await http.post("/auth/register", {
    fullName: dto.fullName ?? "",
    email: dto.email ?? "",
    phone: dto.phone ?? "",
    password: dto.password,
  });

  const emailOrPhone = dto.email || dto.phone || "";
  return login({ emailOrPhone, password: dto.password });
}

/** Logout */
export async function logout() {
  await AsyncStorage.multiRemove([
    AUTH_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    TOKEN_EXPIRES_AT_KEY,
    USER_DATA_KEY,
  ]);
}

/** Get current user (from storage) */
export async function getCurrentUser() {
  const userData = await AsyncStorage.getItem(USER_DATA_KEY);
  return userData ? (JSON.parse(userData) as User) : null;
}

/** Check authentication (token exists) */
export async function isAuthenticated() {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  return !!token;
}

/** Get stored access token */
export async function getToken() {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}
