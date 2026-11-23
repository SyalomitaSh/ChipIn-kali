import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const requireGroupMember = ({
  param = 'groupId',
  adminOnly = false,
  allowedRoles = null,
} = {}) =>
  asyncHandler(async (req, _res, next) => {
    const groupId = req.params[param];

    if (!groupId || !UUID_REGEX.test(groupId)) {
      throw new AppError(
        400,
        'INVALID_GROUP_ID',
        'ID grup tidak valid'
      );
    }

    if (!req.user?.id) {
      throw new AppError(
        401,
        'UNAUTHORIZED',
        'Autentikasi diperlukan'
      );
    }

    const { data, error } = await supabaseAdmin
      .from('group_members')
      .select('group_id, user_id, role, status')
      .eq('group_id', groupId)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) {
      console.error('Group membership check error:', error);

      throw new AppError(
        500,
        'GROUP_ACCESS_CHECK_FAILED',
        'Gagal memeriksa akses grup'
      );
    }

    // Tidak terdaftar sebagai anggota.
    if (!data) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Anda bukan anggota grup ini'
      );
    }

    // Hanya anggota aktif yang boleh mengakses grup.
    if (data.status !== 'active') {
      throw new AppError(
        403,
        'GROUP_ACCESS_INACTIVE',
        'Keanggotaan grup Anda tidak aktif'
      );
    }

    // Owner dan admin memiliki hak administratif.
    if (
      adminOnly &&
      !['owner', 'admin'].includes(data.role)
    ) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Hanya owner atau admin grup yang dapat melakukan aksi ini'
      );
    }

    // Pemeriksaan role khusus jika diperlukan.
    if (
      allowedRoles &&
      !allowedRoles.includes(data.role)
    ) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Role Anda tidak memiliki izin untuk melakukan aksi ini'
      );
    }

    // Simpan informasi keanggotaan untuk controller berikutnya.
    req.group = {
      id: data.group_id,
      role: data.role,
      status: data.status,
    };

    req.groupRole = data.role;

    next();
  });
