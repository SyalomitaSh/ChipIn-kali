import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

const mapJoinCodeError = (error) => {
  const message = error?.message ?? '';

  if (message.includes('JOIN_CODE_NOT_FOUND')) {
    throw new AppError(404, 'INVALID_JOIN_CODE', 'Kode atau link undangan tidak valid');
  }

  if (message.includes('JOIN_CODE_EXPIRED')) {
    throw new AppError(410, 'JOIN_CODE_EXPIRED', 'Kode atau link undangan sudah kedaluwarsa');
  }

  if (message.includes('USER_PROFILE_NOT_FOUND')) {
    throw new AppError(404, 'USER_PROFILE_NOT_FOUND', 'Profil pengguna tidak ditemukan');
  }

  console.error('Join group error:', error);
  throw new AppError(500, 'GROUP_JOIN_FAILED', 'Gagal bergabung ke grup');
};

// GET /api/groups/join/:joinCode — public, used to preview/validate a link before login.
export const getJoinGroupPreview = async (req, res) => {
  const { joinCode } = req.validated.params;

  const { data: group, error } = await supabaseAdmin
    .from('groups')
    .select('id, name, description, created_by, join_code_expires_at, created_at')
    .eq('join_code', joinCode)
    .maybeSingle();

  if (error) {
    console.error('Get join group preview error:', error);
    throw new AppError(500, 'INVITATION_LOOKUP_FAILED', 'Gagal memeriksa link undangan');
  }

  if (!group) {
    throw new AppError(404, 'INVALID_JOIN_CODE', 'Kode atau link undangan tidak valid');
  }

  if (group.join_code_expires_at && new Date(group.join_code_expires_at) <= new Date()) {
    throw new AppError(410, 'JOIN_CODE_EXPIRED', 'Kode atau link undangan sudah kedaluwarsa');
  }

  return res.status(200).json({
    success: true,
    data: {
      invitation: {
        join_code: joinCode,
        expires_at: group.join_code_expires_at,
      },
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        created_by: group.created_by,
        created_at: group.created_at,
      },
    },
  });
};

// POST /api/groups/join — authenticated user joins using a group-wide code.
export const joinGroupByCode = async (req, res) => {
  const { join_code: joinCode } = req.body;

  const { data, error } = await supabaseAdmin.rpc('join_group_by_code', {
    p_join_code: joinCode,
    p_user_id: req.user.id,
  });

  if (error) mapJoinCodeError(error);

  if (!data?.group || !data?.membership) {
    throw new AppError(500, 'GROUP_JOIN_FAILED', 'Gagal bergabung ke grup');
  }

  return res.status(data.already_member ? 200 : 201).json({
    success: true,
    data: {
      group: data.group,
      membership: data.membership,
      already_member: data.already_member,
      message: data.already_member
        ? 'Kamu sudah menjadi anggota grup ini'
        : 'Berhasil bergabung ke grup',
    },
  });
};
