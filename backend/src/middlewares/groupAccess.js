import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// BL-04: pembatasan akses berdasarkan keanggotaan grup.
// Pakai SETELAH requireAuth. Contoh:
//   router.get('/:groupId/members', requireAuth, requireGroupMember(), handler)
//   router.patch('/:groupId', requireAuth, requireGroupMember({ adminOnly: true }), handler)
export const requireGroupMember = ({ param = 'groupId', adminOnly = false } = {}) =>
  asyncHandler(async (req, _res, next) => {
    const { data, error } = await supabaseAdmin
      .from('group_members')
      .select('role')
      .eq('group_id', req.params[param])
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new AppError(403, 'FORBIDDEN', 'Anda bukan anggota grup ini');
    if (adminOnly && data.role !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Hanya admin grup yang dapat melakukan aksi ini');
    }

    req.groupRole = data.role;
    next();
  });
