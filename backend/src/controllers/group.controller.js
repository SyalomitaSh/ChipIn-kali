import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

const ADMIN_ROLES = ['owner', 'admin'];

const handleCreateGroupError = (error) => {
  const message = error.message ?? '';

  if (
    message.includes('INVITED_PROFILE_NOT_FOUND') ||
    message.includes('23503')
  ) {
    throw new AppError(
      404,
      'MEMBER_NOT_FOUND',
      'Salah satu pengguna yang dipilih tidak ditemukan'
    );
  }

  if (message.includes('BACKGROUND_NOT_FOUND')) {
    throw new AppError(
      404,
      'BACKGROUND_NOT_FOUND',
      'Pilihan background tidak ditemukan atau tidak aktif'
    );
  }

  if (message.includes('END_DATE_BEFORE_START_DATE')) {
    throw new AppError(
      400,
      'INVALID_DATE_RANGE',
      'Tanggal selesai tidak boleh sebelum tanggal mulai'
    );
  }

  if (message.includes('USER_PROFILE_NOT_FOUND')) {
    throw new AppError(
      404,
      'USER_PROFILE_NOT_FOUND',
      'Profil pengguna tidak ditemukan'
    );
  }

  throw new AppError(
    500,
    'GROUP_CREATE_FAILED',
    'Gagal membuat grup'
  );
};

// GET /api/groups/backgrounds
export const getGroupBackgrounds = async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('group_backgrounds')
    .select('id, key, name, image_url')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Get group backgrounds error:', error);
    throw new AppError(
      500,
      'BACKGROUND_FETCH_FAILED',
      'Gagal mengambil pilihan background'
    );
  }

  return res.status(200).json({
    success: true,
    data: {
      backgrounds: data ?? [],
    },
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
    throw new AppError(
      400,
      'INVALID_MEMBER_SELECTION',
      'Pembuat grup tidak perlu dipilih sebagai anggota undangan'
    );
  }

  const { data, error } = await supabaseAdmin.rpc(
    'create_group_with_owner',
    {
      p_name: name,
      p_description: description ?? null,
      p_user_id: req.user.id,
      p_member_ids: memberIds,
      // PostgreSQL uses CURRENT_DATE when start_date is omitted.
      p_start_date: startDate ?? null,
      p_end_date: endDate ?? null,
      p_background_id: backgroundId ?? null,
    }
  );

  if (error) {
    console.error('Create group error:', error);
    handleCreateGroupError(error);
  }

  if (!data?.group || !data?.membership) {
    throw new AppError(
      500,
      'GROUP_CREATE_FAILED',
      'Gagal membuat grup'
    );
  }

  return res.status(201).json({
    success: true,
    data: {
      group: data.group,
      membership: data.membership,
      invitations: data.invitations ?? [],
    },
  });
};

// GET /api/groups/:groupId/members
// Hanya anggota aktif yang dapat melihat daftar anggota aktif grup.
export const getGroupMembers = async (req, res) => {
  const { groupId } = req.params;

  const { data: memberships, error: membershipError } =
    await supabaseAdmin
      .from('group_members')
      .select('id, user_id, role, status, joined_at')
      .eq('group_id', groupId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true });

  if (membershipError) {
    console.error('Get group members error:', membershipError);
    throw new AppError(
      500,
      'GROUP_MEMBERS_FETCH_FAILED',
      'Gagal mengambil daftar anggota grup'
    );
  }

  const activeMemberships = memberships ?? [];
  const totalMembers = activeMemberships.length;

  if (totalMembers === 0) {
    return res.status(200).json({
      success: true,
      data: {
        total_members: 0,
        members: [],
      },
    });
  }

  const userIds = activeMemberships.map(({ user_id: userId }) => userId);

  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .in('id', userIds);

  if (profileError) {
    console.error('Get group member profiles error:', profileError);
    throw new AppError(
      500,
      'GROUP_MEMBERS_FETCH_FAILED',
      'Gagal mengambil profil anggota grup'
    );
  }

  const profilesById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );

  const members = activeMemberships.map((membership) => {
    const profile = profilesById.get(membership.user_id);

    return {
      id: membership.id,
      user_id: membership.user_id,
      username: profile?.username ?? null,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      role: membership.role,
      is_admin: ADMIN_ROLES.includes(membership.role),
      status: membership.status,
      joined_at: membership.joined_at,
    };
  });

  return res.status(200).json({
    success: true,
    data: {
      total_members: totalMembers,
      members,
    },
  });
};
