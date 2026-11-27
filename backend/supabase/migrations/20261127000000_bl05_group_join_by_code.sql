-- BL-05: group-wide invitation code/link.
-- Existing group_invitations.invite_code remains for user-specific invitations (BL-06).

begin;

alter table public.groups
  add column if not exists join_code_expires_at timestamptz
  not null default (now() + interval '30 days');

-- Existing groups receive a 30-day validity window from migration time.
-- The join_code itself is already generated uniquely by the groups table default.

create or replace function public.join_group_by_code(
  p_join_code varchar,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group public.groups%rowtype;
  v_membership public.group_members%rowtype;
  v_already_member boolean := false;
begin
  if not exists (
    select 1 from public.profiles p where p.id = p_user_id
  ) then
    raise exception 'USER_PROFILE_NOT_FOUND';
  end if;

  select * into v_group
  from public.groups g
  where g.join_code = upper(trim(p_join_code))
  for update;

  if not found then
    raise exception 'JOIN_CODE_NOT_FOUND';
  end if;

  if v_group.join_code_expires_at is not null
     and v_group.join_code_expires_at <= now() then
    raise exception 'JOIN_CODE_EXPIRED';
  end if;

  select * into v_membership
  from public.group_members gm
  where gm.group_id = v_group.id
    and gm.user_id = p_user_id
  for update;

  if found and v_membership.status = 'active' then
    v_already_member := true;
  elsif found then
    -- Re-activate an existing membership instead of creating a duplicate row.
    update public.group_members
    set status = 'active', joined_at = now()
    where id = v_membership.id
    returning * into v_membership;
  else
    insert into public.group_members (group_id, user_id, role, status)
    values (v_group.id, p_user_id, 'member', 'active')
    returning * into v_membership;
  end if;

  return jsonb_build_object(
    'group', jsonb_build_object(
      'id', v_group.id,
      'name', v_group.name,
      'description', v_group.description,
      'created_by', v_group.created_by,
      'join_code', v_group.join_code
    ),
    'membership', jsonb_build_object(
      'id', v_membership.id,
      'group_id', v_membership.group_id,
      'user_id', v_membership.user_id,
      'role', v_membership.role,
      'status', v_membership.status,
      'joined_at', v_membership.joined_at
    ),
    'already_member', v_already_member
  );
end;
$$;

revoke all on function public.join_group_by_code(varchar, uuid)
  from public, anon, authenticated;
grant execute on function public.join_group_by_code(varchar, uuid)
  to service_role;

grant select on public.groups to service_role;
grant select, insert, update on public.group_members to service_role;

commit;
