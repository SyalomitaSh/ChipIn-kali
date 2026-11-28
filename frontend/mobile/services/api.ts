const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
    throw new Error('EXPO_PUBLIC_API_URL belum dikonfigurasi.');
}

type ApiOptions = {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    token?: string;
};

export class ApiError extends Error {
    status: number;
    code?: string;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
    }
}

export async function apiRequest<T>(
    endpoint: string,
    options: ApiOptions = {},
): Promise<T> {
    const { method = 'GET', body, token } = options;

    const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    const data = await response.json();

    if (!response.ok) {
        const errorMessage =
            typeof data?.error === 'string'
                ? data.error
                : data?.error?.message ?? 'Terjadi kesalahan pada server.';

        const errorCode =
            typeof data?.error === 'object'
                ? data.error?.code
                : undefined;

        throw new ApiError(errorMessage, response.status, errorCode);
    }

    return data as T;
}