
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

const AVATAR_BUCKET = 'avatars';

const profileFields =
  'id, username, full_name, avatar_url, created_at, updated_at';

const formatUser = (profile, email) => ({
  id: profile.id,
  username: profile.username,
  full_name: profile.full_name,
  email,
  avatar_url: profile.avatar_url,
  created_at: profile.created_at,
  updated_at: profile.updated_at,
});

// GET /api/users/me
export const getMe = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(profileFields)
    .eq('id', req.user.id)
    .maybeSingle();

  if (error) {
    console.error('Get profile error:', error);

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
    success: true,
    data: {
      user: formatUser(data, req.user.email),
    },
  });
};

// PATCH /api/users/me
// Update nama dan/atau foto profil.
export const updateMe = async (req, res) => {
  const { full_name } = req.body;
  const avatar = req.file;

  if (full_name === undefined && !avatar) {
    throw new AppError(
      400,
      'EMPTY_UPDATE',
      'Minimal kirim nama lengkap atau foto profil'
    );
  }

  const updateData = {};

  // Update nama jika dikirim.
  if (full_name !== undefined) {
    updateData.full_name = full_name;
  }

  // Upload avatar jika file dikirim.
  if (avatar) {
    const { data: uploadData, error: uploadError } =
      await supabaseAdmin.storage
        .from(AVATAR_BUCKET)
        .upload(
          `${req.user.id}/avatar`,
          avatar.buffer,
          {
            contentType: avatar.mimetype,
            upsert: true,
            cacheControl: '0',
          }
        );

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);

      throw new AppError(
        500,
        'AVATAR_UPLOAD_FAILED',
        'Gagal mengunggah foto profil'
      );
    }

    const { data: publicUrlData } =
      supabaseAdmin.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(uploadData.path);

    updateData.avatar_url = publicUrlData.publicUrl;
  }

  // Update hanya field yang dikirim pengguna.
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updateData)
    .eq('id', req.user.id)
    .select(profileFields)
    .maybeSingle();

  if (error) {
    console.error('Update profile error:', error);

    throw new AppError(
      500,
      'INTERNAL_ERROR',
      'Gagal memperbarui profil'
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
    success: true,
    data: {
      user: formatUser(data, req.user.email),
    },
  });
};