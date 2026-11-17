import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

// GET /api/users/me
export const getMe = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, full_name')
    .eq('id', req.user.id)
    .maybeSingle();

  if (error) {
    throw new AppError(
      500,
      'INTERNAL_ERROR',
      'Gagal mengambil profil'
    );
  }

  if (!data) {
    throw new AppError(
      404,
      'PROFILE_NOT_FOUND',
      'Profil tidak ditemukan'
    );
  }

  res.status(200).json({
    data: {
      id: data.id,
      username: data.username,
      full_name: data.full_name,
      email: req.user.email,
    },
  });
};

// BL-03 — PATCH /api/users/me
export const updateMe = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ full_name: req.body.full_name })
    .eq('id', req.user.id)
    .select('id, full_name, created_at')
    .single();

  if (error) throw error;

  res.json({ success: true, data: { ...data, email: req.user.email } });
};