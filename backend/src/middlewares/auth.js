import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(
      401,
      'UNAUTHORIZED',
      'Token autentikasi tidak ditemukan'
    );
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    throw new AppError(
      401,
      'UNAUTHORIZED',
      'Token autentikasi tidak ditemukan'
    );
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    throw new AppError(
      401,
      'UNAUTHORIZED',
      'Token tidak valid atau sudah kedaluwarsa'
    );
  }

  req.user = data.user;
  req.token = token;

  next();
});
