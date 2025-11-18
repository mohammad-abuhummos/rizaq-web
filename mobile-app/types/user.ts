export interface User {
    id: string;
    email: string;
    phone?: string;
    role: string;
    name?: string;
    avatar?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface LoginCredentials {
    identifier: string; // email or phone
    password: string;
}

export interface RegisterCredentials {
    email?: string;
    phone?: string;
    password: string;
    name?: string;
    role?: string;
}
