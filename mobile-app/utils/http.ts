import { getAuthToken } from '@/storage/auth-storage';
import { emitApiError } from './api-error-events';
import { getApiBaseUrl, isDevelopment } from './config';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string | null;
    meta?: unknown;
    traceId?: string;
    error?: unknown;
}

export class HttpClient {
    private readonly baseUrl: string;
    private readonly defaultHeaders: Record<string, string>;

    constructor(baseUrl = getApiBaseUrl()) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    private url(path: string): string {
        const clean = path.startsWith('/') ? path : `/${path}`;
        return `${this.baseUrl}${clean}`;
    }

    async request<T>(method: HttpMethod, path: string, body?: unknown, init?: RequestInit): Promise<ApiResponse<T>> {
        const mergedHeaders: Record<string, string> = {
            ...this.defaultHeaders,
            ...(init?.headers as Record<string, string> | undefined),
        };

        const requestInit: RequestInit = {
            method,
            ...init,
            headers: mergedHeaders,
        };

        if (body !== undefined && body !== null && method !== 'GET') {
            const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
            if (isFormData) {
                // Let fetch set proper multipart boundaries; remove default JSON header
                if (requestInit.headers && (requestInit.headers as Record<string, string>)['Content-Type']) {
                    delete (requestInit.headers as Record<string, string>)['Content-Type'];
                }
                requestInit.body = body as any;
            } else {
                requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
            }
        }

        if (isDevelopment()) {
            console.log(`[HTTP] ${method} ${this.url(path)}`, body ?? '');
        }

        // Inject Authorization header if token available and not already provided
        try {
            const token = await getAuthToken();
            if (token && !(requestInit.headers as Record<string, string>)['Authorization']) {
                (requestInit.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
            }
        } catch { }

        let res: Response;
        try {
            res = await fetch(this.url(path), requestInit);
        } catch (networkError: any) {
            // Network error (no internet, timeout, etc.)
            const error = new Error(`Network error: ${networkError?.message || 'Failed to connect to server'}`);
            (error as any).status = 0;
            (error as any).isNetworkError = true;
            throw error;
        }

        const text = await res.text();
        let json: any;
        try {
            json = text ? JSON.parse(text) : {};
        } catch {
            json = { success: res.ok, data: null, message: text };
        }

        if (isDevelopment()) {
            console.log(`[HTTP] <= ${res.status} ${path}`, json);
        }

        if (!res.ok) {
            const payload: any = json ?? {};
            const serverError = (payload?.error ?? {}) as any;
            let extractedMessage: string | undefined;

            if (typeof payload?.error === 'string') {
                extractedMessage = payload.error;
            } else if (serverError && typeof serverError === 'object') {
                extractedMessage = serverError.message ?? serverError.detail ?? serverError.title;
            }

            if (!extractedMessage && typeof payload?.message === 'string') {
                extractedMessage = payload.message;
            }

            if (!extractedMessage) {
                const dataField = payload?.data;
                if (typeof dataField === 'string') {
                    extractedMessage = dataField;
                } else if (Array.isArray(dataField)) {
                    extractedMessage = dataField.filter((item) => typeof item === 'string')[0];
                }
            }

            const errorMessage = extractedMessage || `HTTP ${res.status}`;

            if (res.status === 400 || res.status === 404) {
                emitApiError({
                    status: res.status,
                    message: errorMessage,
                    response: payload,
                    path,
                    method,
                });
            }

            const error = new Error(errorMessage);
            (error as any).status = res.status;
            (error as any).response = json;
            // Normalize server error format to include code/detail when present
            if (serverError?.code) (error as any).code = serverError.code;
            if (serverError?.detail) (error as any).detail = serverError.detail;
            throw error;
        }

        return json as ApiResponse<T>;
    }

    get<T>(path: string, init?: RequestInit) {
        return this.request<T>('GET', path, undefined, init);
    }
    post<T>(path: string, body?: unknown, init?: RequestInit) {
        return this.request<T>('POST', path, body, init);
    }
    put<T>(path: string, body?: unknown, init?: RequestInit) {
        return this.request<T>('PUT', path, body, init);
    }
    patch<T>(path: string, body?: unknown, init?: RequestInit) {
        return this.request<T>('PATCH', path, body, init);
    }
    delete<T>(path: string, init?: RequestInit) {
        return this.request<T>('DELETE', path, undefined, init);
    }
}

export const http = new HttpClient();


