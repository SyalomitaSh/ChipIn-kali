
import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from 'react';

import {
    getProfile,
    login,
    logout,
    refreshToken,
} from '../services/auth.service';

import {
    getTokens,
    saveTokens,
    clearTokens,
} from '../services/token.service';

import type { AuthUser } from '../services/auth.service';
import { ApiError } from '../services/api';

type AuthContextType = {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = user !== null;

    // Memeriksa session ketika aplikasi dibuka
    const checkAuth = async () => {
        try {
            const tokens = await getTokens();

            if (!tokens.accessToken || !tokens.refreshToken) {
                await clearTokens();
                setUser(null);
                return;
            }

            try {
                // Coba mengambil profil dengan access token
                const response = await getProfile(tokens.accessToken);
                setUser(response.data.user);
            } catch (error) {
                // Refresh hanya jika access token mendapatkan HTTP 401
                if (!(error instanceof ApiError) || error.status !== 401) {
                    throw error;
                }

                // Refresh session menggunakan refresh token
                const refreshed = await refreshToken({
                    refresh_token: tokens.refreshToken,
                });

                const newAccessToken = refreshed.data.session.access_token;
                const newRefreshToken = refreshed.data.session.refresh_token;

                // Simpan token terbaru
                await saveTokens(newAccessToken, newRefreshToken);

                // Ambil profil menggunakan access token baru
                const response = await getProfile(newAccessToken);
                setUser(response.data.user);
            }
        } catch (error) {
            // Session tidak dapat dipulihkan
            await clearTokens();
            setUser(null);
        }
    };

    // Fungsi login
    const signIn = async (email: string, password: string) => {
        const response = await login({
            email,
            password,
        });

        const session = response.data.session;

        // Simpan token setelah login berhasil
        await saveTokens(
            session.access_token,
            session.refresh_token,
        );

        // Ambil profil pengguna
        const profile = await getProfile(session.access_token);

        // Perbarui state user
        setUser(profile.data.user);
    };

    // Fungsi logout
    const signOut = async () => {
        const tokens = await getTokens();

        try {
            if (tokens.accessToken) {
                await logout(tokens.accessToken);
            }
        } finally {
            // Hapus token dan status user
            await clearTokens();
            setUser(null);
        }
    };

    // Menjalankan checkAuth ketika AuthProvider pertama kali dimuat
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                await checkAuth();
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoading,
                signIn,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Custom Hook untuk mengakses Auth Context
export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error(
            'useAuth harus digunakan di dalam AuthProvider.',
        );
    }

    return context;
}
