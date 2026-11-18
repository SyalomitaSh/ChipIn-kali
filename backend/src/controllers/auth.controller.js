import {
  createAnonClient,
  supabaseAdmin,
} from '../config/supabase.js';

import { AppError } from '../utils/AppError.js';

// ==========================================
// RESPONSE FORMATTERS
// ==========================================

const formatSession = (session) => {
  if (!session) return null;

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  };
};

const formatUser = (user) => ({
  id: user.id,
  username: user.user_metadata?.username ?? null,
  full_name: user.user_metadata?.full_name ?? null,
  email: user.email,
});

// ==========================================
// SUPABASE ERROR HANDLING
// ==========================================

const isRateLimitError = (error) =>
  error?.status === 429 ||
  ['over_request_rate_limit', 'over_email_send_rate_limit'].includes(error?.code);

const isDuplicateEmailError = (error) =>
  ['user_already_exists', 'email_exists'].includes(error?.code) ||
  /already registered|already exists/i.test(error?.message ?? '');

// ==========================================
// BL-01 REGISTER
// POST /api/auth/register
// ==========================================

export const register = async (req, res) => {
  const { username, full_name, email, password } = req.body;

  // Pemeriksaan awal agar username yang sudah dipakai mendapat
  // respons 409 sebelum Supabase Auth membuat akun.
  const { data: existingUsername, error: usernameCheckError } =
    await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .limit(1)
      .maybeSingle();

  if (usernameCheckError) {
    console.error('Username check error:', usernameCheckError);
    throw new AppError(
      500,
      'INTERNAL_ERROR',
      'Gagal memeriksa ketersediaan username'
    );
  }

  if (existingUsername) {
    throw new AppError(
      409,
      'USERNAME_TAKEN',
      'Username sudah digunakan'
    );
  }

  const supabase = createAnonClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name,
      },
    },
  });

  if (error) {
    if (isRateLimitError(error)) {
      throw new AppError(
        429,
        'RATE_LIMITED',
        'Terlalu banyak request, coba lagi nanti'
      );
    }

    if (error.code === 'email_address_invalid') {
      throw new AppError(
        400,
        'INVALID_EMAIL',
        'Format email tidak valid'
      );
    }

    if (isDuplicateEmailError(error)) {
      throw new AppError(
        409,
        'EMAIL_TAKEN',
        'Email sudah terdaftar'
      );
    }

    console.error('Register error:', error);

    throw new AppError(
      500,
      'INTERNAL_ERROR',
      'Terjadi kesalahan saat registrasi'
    );
  }

  // Supabase dapat mengembalikan identities kosong
  // untuk email yang sudah terdaftar.
  if (data.user?.identities?.length === 0) {
    throw new AppError(
      409,
      'EMAIL_TAKEN',
      'Email sudah terdaftar'
    );
  }

  if (!data.user) {
    throw new AppError(
      500,
      'INTERNAL_ERROR',
      'Gagal membuat akun'
    );
  }

  res.status(201).json({
    success: true,
    data: {
      user: formatUser(data.user),
      // session dapat bernilai null jika konfirmasi email diaktifkan
      // pada pengaturan Supabase Auth.
      session: formatSession(data.session),
      requires_email_confirmation: data.session === null,
    },
  });
};

// ==========================================
// BL-02 LOGIN
// POST /api/auth/login
// ==========================================

export const login = async (req, res) => {
  const { email, password } = req.body;

  const supabase = createAnonClient();

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    if (isRateLimitError(error)) {
      throw new AppError(
        429,
        'RATE_LIMITED',
        'Terlalu banyak percobaan login, coba lagi nanti'
      );
    }

    if (error.code === 'invalid_credentials') {
      throw new AppError(
        401,
        'INVALID_CREDENTIALS',
        'Email atau password salah'
      );
    }

    if (error.code === 'email_not_confirmed') {
      throw new AppError(
        403,
        'EMAIL_NOT_CONFIRMED',
        'Silakan konfirmasi email terlebih dahulu'
      );
    }

    console.error('Login error:', error);

    throw new AppError(
      500,
      'INTERNAL_ERROR',
      'Terjadi kesalahan saat login'
    );
  }

  if (!data.user || !data.session) {
    throw new AppError(
      500,
      'LOGIN_FAILED',
      'Gagal membuat sesi login'
    );
  }

  res.status(200).json({
    success: true,
    data: {
      user: formatUser(data.user),
      session: formatSession(data.session),
    },
  });
};

// ==========================================
// BL-02 REFRESH SESSION
// POST /api/auth/refresh
// ==========================================

export const refresh = async (req, res) => {
  const { refresh_token } = req.body;

  const supabase = createAnonClient();

  const { data, error } =
    await supabase.auth.refreshSession({
      refresh_token,
    });

  if (error || !data.session) {
    if (error && isRateLimitError(error)) {
      throw new AppError(
        429,
        'RATE_LIMITED',
        'Terlalu banyak request, coba lagi nanti'
      );
    }

    if (error && error.status >= 500) {
      console.error('Refresh error:', error);

      throw new AppError(
        500,
        'INTERNAL_ERROR',
        'Gagal memperbarui sesi'
      );
    }

    throw new AppError(
      401,
      'INVALID_REFRESH_TOKEN',
      'Refresh token tidak valid atau sudah kedaluwarsa'
    );
  }

  res.status(200).json({
    success: true,
    data: {
      session: formatSession(data.session),
    },
  });
};

// ==========================================
// BL-02 LOGOUT
// POST /api/auth/logout
// ==========================================

export const logout = async (req, res) => {
  const { error } =
    await supabaseAdmin.auth.admin.signOut(
      req.token,
      'local'
    );

  if (error) {
    console.error('Logout error:', error);

    throw new AppError(
      500,
      'LOGOUT_FAILED',
      'Gagal mengakhiri sesi'
    );
  }

  res.status(200).json({
    success: true,
    data: {
      message: 'Logout berhasil',
    },
  });
};