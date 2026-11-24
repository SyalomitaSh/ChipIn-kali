import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

// GET /api/groups/backgrounds
export const getGroupBackgrounds = async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('group_backgrounds')
    .select('id, key, name, image_url')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Get group backgrounds error:', error);
    throw new AppError(500, 'BACKGROUND_FETCH_FAILED', 'Gagal mengambil pilihan background');
  }

  res.status(200).json({
    success: true,
    data: { backgrounds: data ?? [] },
  });
};

// POST /api/groups
export const createGroup = async (req, res) => {
  const {
    name,
    description,
    start_date: startDate,
    end_date: endDate,
    background_id: backgroundId,
    member_ids: memberIds,
  } = req.body;

  if (memberIds.includes(req.user.id)) {
    throw new AppError(400, 'INVALID_MEMBER_SELECTION',
      'Pembuat grup tidak perlu dipilih sebagai anggota undangan');
  }

  const { data, error } = await supabaseAdmin.rpc('create_group_with_owner', {
    p_name: name,
    p_description: description ?? null,
    p_user_id: req.user.id,
    p_member_ids: memberIds,
    // Omitted start_date is defaulted by PostgreSQL to CURRENT_DATE.
    p_start_date: startDate ?? null,
    p_end_date: endDate ?? null,
    p_background_id: backgroundId ?? null,
  });

  if (error) {
    console.error('Create group error:', error);

    if (error.message?.includes('INVITED_PROFILE_NOT_FOUND') || error.message?.includes('23503')) {
      throw new AppError(404, 'MEMBER_NOT_FOUND', 'Salah satu pengguna yang dipilih tidak ditemukan');
    }
    if (error.message?.includes('BACKGROUND_NOT_FOUND')) {
      throw new AppError(404, 'BACKGROUND_NOT_FOUND', 'Pilihan background tidak ditemukan atau tidak aktif');
    }
    if (error.message?.includes('END_DATE_BEFORE_START_DATE')) {
      throw new AppError(400, 'INVALID_DATE_RANGE', 'Tanggal selesai tidak boleh sebelum tanggal mulai');
    }
    if (error.message?.includes('USER_PROFILE_NOT_FOUND')) {
      throw new AppError(404, 'USER_PROFILE_NOT_FOUND', 'Profil pengguna tidak ditemukan');
    }

    throw new AppError(500, 'GROUP_CREATE_FAILED', 'Gagal membuat grup');
  }

  if (!data?.group || !data?.membership) {
    throw new AppError(500, 'GROUP_CREATE_FAILED', 'Gagal membuat grup');
  }

  res.status(201).json({
    success: true,
    data: {
      group: data.group,
      membership: data.membership,
      invitations: data.invitations ?? [],
    },
  });
};