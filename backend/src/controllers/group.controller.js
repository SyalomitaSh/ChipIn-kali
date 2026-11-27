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


// GET /api/groups — daftar grup yang diikuti user saat ini.
// Search dan filter status diterapkan pada hasil milik user.
export const getMyGroups = async (req, res) => {
  const userId = req.user.id;
  const query = req.validated?.query ?? req.query;
  const search = (query.search ?? '').trim().toLowerCase();
  const statusFilter = query.status ?? 'all';

  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (membershipError) {
    console.error('Get my groups memberships error:', membershipError);
    throw new AppError(500, 'GROUPS_FETCH_FAILED', 'Gagal mengambil daftar grup');
  }

  const groupIds = [...new Set((memberships ?? []).map(({ group_id: groupId }) => groupId))];

  if (groupIds.length === 0) {
    return res.status(200).json({
      success: true,
      data: { total: 0, groups: [] },
    });
  }

  const { data: groups, error: groupsError } = await supabaseAdmin
    .from('groups')
    .select('id, name, description, background_id, created_by, created_at')
    .in('id', groupIds)
    .order('created_at', { ascending: false });

  if (groupsError) {
    console.error('Get my groups error:', groupsError);
    throw new AppError(500, 'GROUPS_FETCH_FAILED', 'Gagal mengambil daftar grup');
  }

  const [memberResult, transactionResult, memberBillResult] = await Promise.all([
    supabaseAdmin
      .from('group_members')
      .select('group_id')
      .in('group_id', groupIds)
      .eq('status', 'active'),
    supabaseAdmin
      .from('transactions')
      .select('id, group_id')
      .in('group_id', groupIds)
      .neq('status', 'cancelled'),
    supabaseAdmin
      .from('member_bills')
      .select('transaction_id, payment_status')
      .eq('user_id', userId),
  ]);

  if (memberResult.error || transactionResult.error || memberBillResult.error) {
    console.error('Get my groups summary error:', {
      members: memberResult.error,
      transactions: transactionResult.error,
      memberBills: memberBillResult.error,
    });
    throw new AppError(500, 'GROUPS_SUMMARY_FETCH_FAILED', 'Gagal mengambil ringkasan grup');
  }

  const memberCounts = new Map();
  for (const { group_id: groupId } of memberResult.data ?? []) {
    memberCounts.set(groupId, (memberCounts.get(groupId) ?? 0) + 1);
  }

  const transactions = transactionResult.data ?? [];
  const transactionGroupById = new Map(
    transactions.map(({ id, group_id: groupId }) => [id, groupId])
  );
  const billCounts = new Map();
  for (const transaction of transactions) {
    billCounts.set(
      transaction.group_id,
      (billCounts.get(transaction.group_id) ?? 0) + 1
    );
  }

  const unsettledGroups = new Set();
  const groupsWithBills = new Set();
  for (const bill of memberBillResult.data ?? []) {
    const groupId = transactionGroupById.get(bill.transaction_id);
    if (!groupId) continue;

    groupsWithBills.add(groupId);
    if (bill.payment_status !== 'paid') unsettledGroups.add(groupId);
  }

  let result = (groups ?? []).map((group) => {
    const hasUnsettledBills = unsettledGroups.has(group.id);
    const hasBills = groupsWithBills.has(group.id);

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      background_id: group.background_id,
      created_by: group.created_by,
      created_at: group.created_at,
      total_members: memberCounts.get(group.id) ?? 0,
      total_bills: billCounts.get(group.id) ?? 0,
      settlement_status: hasUnsettledBills
        ? 'unsettled'
        : hasBills
          ? 'settled'
          : 'no_bills',
    };
  });

  if (search) {
    result = result.filter((group) => group.name.toLowerCase().includes(search));
  }

  if (statusFilter === 'unsettled') {
    result = result.filter((group) => group.settlement_status === 'unsettled');
  } else if (statusFilter === 'settled') {
    result = result.filter((group) => group.settlement_status === 'settled');
  }

  return res.status(200).json({
    success: true,
    data: {
      total: result.length,
      groups: result,
    },
  });
};
