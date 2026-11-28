import * as SecureStore from 'expo-secure-store';

// Menyimpan access token dan refresh token
export async function saveTokens(
    accessToken: string,
    refreshToken: string,
): Promise<void> {
    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('refresh_token', refreshToken);
}

// Mengambil access token dan refresh token
export async function getTokens() {
    const accessToken = await SecureStore.getItemAsync('access_token');
    const refreshToken = await SecureStore.getItemAsync('refresh_token');

    return {
        accessToken,
        refreshToken,
    };
}

// Menghapus access token dan refresh token
export async function clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
}