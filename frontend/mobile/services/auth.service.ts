import { apiRequest } from './api';

// Data yang dikirim saat register
export type RegisterPayload = {
    username: string;
    full_name: string;
    email: string;
    password: string;
};

// Data yang dikirim saat login
export type LoginPayload = {
    email: string;
    password: string;
};

// Data yang dikirim saat refresh token
export type RefreshTokenPayload = {
    refresh_token: string;
};

// Informasi pengguna dari API
export type AuthUser = {
    id: string;
    username: string;
    full_name: string;
    email: string;
};

// Informasi session dari API
export type AuthSession = {
    access_token: string;
    refresh_token: string;
    expires_at: number;
};

// Response register
export type RegisterResponse = {
    success: boolean;
    data: {
        user: AuthUser;
        session: AuthSession | null;
        requires_email_confirmation: boolean;
    };
};

// Response login
export type LoginResponse = {
    success: boolean;
    data: {
        user: AuthUser;
        session: AuthSession;
    };
};

// Response refresh token
export type RefreshTokenResponse = {
    success: boolean;
    data: {
        session: AuthSession;
    };
};

// Response logout
export type LogoutResponse = {
    success: boolean;
    data: {
        message: string;
    };
};

// Response get profile
export type ProfileResponse = {
    success: boolean;
    data: {
        user: AuthUser & {
            avatar_url: string | null;
        };
    };
};

// Fungsi register
export async function register(
    payload: RegisterPayload,
): Promise<RegisterResponse> {
    return apiRequest<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: payload,
    });
}

// Fungsi login
export async function login(
    payload: LoginPayload,
): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: payload,
    });
}

// Fungsi refresh token
export async function refreshToken(
    payload: RefreshTokenPayload,
): Promise<RefreshTokenResponse> {
    return apiRequest<RefreshTokenResponse>('/auth/refresh', {
        method: 'POST',
        body: payload,
    });
}

// Fungsi logout
export async function logout(
    accessToken: string,
): Promise<LogoutResponse> {
    return apiRequest<LogoutResponse>('/auth/logout', {
        method: 'POST',
        token: accessToken,
    });
}

// Fungsi get profile
export async function getProfile(
    accessToken: string,
): Promise<ProfileResponse> {
    return apiRequest<ProfileResponse>('/users/me', {
        method: 'GET',
        token: accessToken,
    });
}