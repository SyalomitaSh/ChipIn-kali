-- ChipIn initial schema for Supabase PostgreSQL
-- Apply ONCE to a fresh database. Do not run alongside the matching migration.
begin;
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Authentication profile; email remains in auth.users.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username varchar(30) not null,
  full_name varchar(100) not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username = lower(username) and username ~ '^[a-z0-9_]{3,30}$')
);
create unique index profiles_username_uidx on public.profiles(lower(username));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_username text; v_full_name text;
begin
  v_username := lower(coalesce(nullif(new.raw_user_meta_data ->> 'username',''),
    'user_' || substr(replace(new.id::text,'-',''),1,12)));
  v_full_name := coalesce(nullif(new.raw_user_meta_data ->> 'full_name',''),
    nullif(split_part(coalesce(new.email,''),'@',1),''),'Pengguna');
  insert into public.profiles(id,username,full_name)
  values(new.id,v_username,v_full_name) on conflict(id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  description text,
  join_code varchar(20) not null unique default upper(substr(encode(gen_random_bytes(8),'hex'),1,10)),
  join_code_expires_at timestamptz not null default (now() + interval '30 days'),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- BL-06: selectable group background catalog.
-- Image files live in Supabase Storage/CDN; this table stores their metadata and URL.
create table public.group_backgrounds (
  id uuid primary key default gen_random_uuid(),
  key varchar(50) not null unique,
  name varchar(100) not null,
  image_url text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.groups
  add column start_date date not null default current_date,
  add column end_date date,
  add column background_id uuid
    references public.group_backgrounds(id) on delete set null,
  add constraint groups_date_range_check
    check (end_date is null or end_date >= start_date);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role varchar(20) not null default 'member' check(role in ('owner','admin','member')),
  status varchar(20) not null default 'active' check(status in ('pending','active','left','removed')),
  joined_at timestamptz not null default now(),
  unique(group_id,user_id)
);
create table public.group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  invited_user_id uuid references public.profiles(id) on delete set null,
  invited_email varchar(255),
  invite_code varchar(30) not null unique default upper(substr(encode(gen_random_bytes(8),'hex'),1,12)),
  status varchar(20) not null default 'pending' check(status in ('pending','accepted','expired','revoked')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  check(invited_user_id is not null or invited_email is not null)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(60) not null unique,
  description text,
  created_at timestamptz not null default now()
);
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title varchar(150) not null,
  description text,
  transaction_date date not null default current_date,
  subtotal numeric(14,2) not null default 0 check(subtotal >= 0),
  total_amount numeric(14,2) not null default 0 check(total_amount >= 0),
  status varchar(20) not null default 'draft'
    check(status in ('draft','processing','confirmed','settled','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.receipt_scans (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  image_url text not null,
  ocr_result jsonb,
  status varchar(20) not null default 'pending'
    check(status in ('pending','processing','review','approved','rejected','failed')),
  scanned_at timestamptz not null default now()
);
create table public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  item_name varchar(150) not null,
  quantity numeric(12,3) not null default 1 check(quantity > 0),
  unit_price numeric(14,2) not null check(unit_price >= 0),
  total_price numeric(14,2) not null check(total_price >= 0),
  source varchar(20) not null default 'manual' check(source in ('manual','ocr')),
  created_at timestamptz not null default now()
);
create table public.transaction_charges (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  charge_type varchar(20) not null check(charge_type in ('tax','service','shipping','discount','other')),
  description varchar(150),
  amount numeric(14,2) not null check(amount >= 0),
  allocation_method varchar(20) not null default 'proportional'
    check(allocation_method in ('proportional','equal','manual')),
  created_at timestamptz not null default now()
);
create table public.item_allocations (
  id uuid primary key default gen_random_uuid(),
  transaction_item_id uuid not null references public.transaction_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  quantity numeric(12,3) not null check(quantity > 0),
  allocated_amount numeric(14,2) not null check(allocated_amount >= 0),
  created_at timestamptz not null default now(),
  unique(transaction_item_id,user_id)
);
create table public.member_bills (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  item_subtotal numeric(14,2) not null default 0 check(item_subtotal >= 0),
  additional_charges numeric(14,2) not null default 0 check(additional_charges >= 0),
  discount_amount numeric(14,2) not null default 0 check(discount_amount >= 0),
  total_amount numeric(14,2) not null default 0 check(total_amount >= 0),
  payment_status varchar(24) not null default 'unpaid'
    check(payment_status in ('unpaid','pending_confirmation','paid','disputed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(transaction_id,user_id)
);
-- Off-app transfers; no payment gateway integration.
create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  from_user_id uuid not null references public.profiles(id) on delete restrict,
  to_user_id uuid not null references public.profiles(id) on delete restrict,
  amount numeric(14,2) not null check(amount > 0),
  status varchar(20) not null default 'unpaid'
    check(status in ('unpaid','reported_paid','confirmed','rejected')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(from_user_id <> to_user_id)
);
create table public.payment_status_history (
  id uuid primary key default gen_random_uuid(),
  member_bill_id uuid not null references public.member_bills(id) on delete cascade,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  old_status varchar(24),
  new_status varchar(24) not null
    check(new_status in ('unpaid','pending_confirmation','paid','disputed')),
  note text,
  changed_at timestamptz not null default now()
);

-- Personal budgets only. Spending should be calculated from the user's member_bills.
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name varchar(100) not null,
  amount numeric(14,2) not null check(amount > 0),
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(start_date <= end_date)
);
create table public.budget_alerts (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  alert_type varchar(30) not null,
  threshold_percentage numeric(5,2) not null check(threshold_percentage between 0 and 100),
  current_percentage numeric(7,2) not null check(current_percentage >= 0),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.expense_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  budget_id uuid references public.budgets(id) on delete set null,
  period_start date not null,
  period_end date not null,
  analysis_result text not null,
  recommendations text,
  model_name varchar(100),
  generated_at timestamptz not null default now(),
  check(period_start <= period_end)
);

-- Indexes
create index group_members_user_status_idx on public.group_members(user_id,status);
create index group_invitations_group_status_idx on public.group_invitations(group_id,status);
create index transactions_group_date_idx on public.transactions(group_id,transaction_date desc);
create index receipt_scans_transaction_idx on public.receipt_scans(transaction_id);
create index transaction_items_transaction_idx on public.transaction_items(transaction_id);
create index transaction_charges_transaction_idx on public.transaction_charges(transaction_id);
create index item_allocations_user_idx on public.item_allocations(user_id);
create index member_bills_user_status_idx on public.member_bills(user_id,payment_status);
create index settlements_transaction_status_idx on public.settlements(transaction_id,status);
create index budgets_user_period_idx on public.budgets(user_id,start_date,end_date);
create index budget_alerts_budget_created_idx on public.budget_alerts(budget_id,created_at desc);
create index expense_analyses_user_generated_idx on public.expense_analyses(user_id,generated_at desc);

-- updated_at triggers
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger groups_updated_at before update on public.groups for each row execute function public.set_updated_at();
create trigger transactions_updated_at before update on public.transactions for each row execute function public.set_updated_at();
create trigger member_bills_updated_at before update on public.member_bills for each row execute function public.set_updated_at();
create trigger settlements_updated_at before update on public.settlements for each row execute function public.set_updated_at();
create trigger budgets_updated_at before update on public.budgets for each row execute function public.set_updated_at();

-- RLS helper functions
create or replace function public.is_active_group_member(p_group_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.group_members gm
 where gm.group_id=p_group_id and gm.user_id=(select auth.uid()) and gm.status='active')
$$;
create or replace function public.is_transaction_group_member(p_transaction_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.transactions t join public.group_members gm on gm.group_id=t.group_id
 where t.id=p_transaction_id and gm.user_id=(select auth.uid()) and gm.status='active')
$$;
create or replace function public.is_budget_owner(p_budget_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.budgets b where b.id=p_budget_id and b.user_id=(select auth.uid()))
$$;

-- Enable RLS on all application tables
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_backgrounds enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invitations enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.receipt_scans enable row level security;
alter table public.transaction_items enable row level security;
alter table public.transaction_charges enable row level security;
alter table public.item_allocations enable row level security;
alter table public.member_bills enable row level security;
alter table public.settlements enable row level security;
alter table public.payment_status_history enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_alerts enable row level security;
alter table public.expense_analyses enable row level security;

-- Grant required privileges for backend service role
GRANT SELECT, UPDATE
ON TABLE public.profiles
TO service_role;

GRANT SELECT
ON TABLE public.group_members
TO service_role;

GRANT SELECT, INSERT
ON TABLE public.groups
TO service_role;

GRANT SELECT, INSERT
ON TABLE public.group_members
TO service_role;

-- Profiles: self and active fellow group members can read; only self can update.
create policy profiles_read on public.profiles for select to authenticated using (
 id=(select auth.uid()) or exists(
  select 1 from public.group_members mine join public.group_members peer on peer.group_id=mine.group_id
  where mine.user_id=(select auth.uid()) and mine.status='active'
  and peer.user_id=profiles.id and peer.status='active'));
create policy profiles_update_self on public.profiles for update to authenticated
using(id=(select auth.uid())) with check(id=(select auth.uid()));

create policy groups_read_members on public.groups for select to authenticated
using(public.is_active_group_member(id) or created_by=(select auth.uid()));
create policy groups_create_self on public.groups for insert to authenticated
with check(created_by=(select auth.uid()));
create policy groups_update_admin on public.groups for update to authenticated
using(exists(select 1 from public.group_members gm where gm.group_id=groups.id
 and gm.user_id=(select auth.uid()) and gm.status='active' and gm.role in ('owner','admin')))
with check(exists(select 1 from public.group_members gm where gm.group_id=groups.id
 and gm.user_id=(select auth.uid()) and gm.status='active' and gm.role in ('owner','admin')));

-- Membership/invitation writes are intentionally reserved for trusted backend.
create policy group_members_read on public.group_members for select to authenticated
using(public.is_active_group_member(group_id) or user_id=(select auth.uid()));
create policy invitations_read on public.group_invitations for select to authenticated
using(public.is_active_group_member(group_id) or invited_user_id=(select auth.uid()));
create policy categories_read on public.categories for select to authenticated using(true);
create policy group_backgrounds_read on public.group_backgrounds for select to authenticated using(is_active = true);

create policy transactions_read on public.transactions for select to authenticated
using(public.is_active_group_member(group_id));
create policy receipt_scans_read on public.receipt_scans for select to authenticated
using(public.is_transaction_group_member(transaction_id));
create policy items_read on public.transaction_items for select to authenticated
using(public.is_transaction_group_member(transaction_id));
create policy charges_read on public.transaction_charges for select to authenticated
using(public.is_transaction_group_member(transaction_id));
create policy allocations_read on public.item_allocations for select to authenticated
using(public.is_transaction_group_member((select ti.transaction_id from public.transaction_items ti
 where ti.id=item_allocations.transaction_item_id)));
create policy member_bills_read on public.member_bills for select to authenticated
using(user_id=(select auth.uid()) or public.is_transaction_group_member(transaction_id));
create policy settlements_read on public.settlements for select to authenticated
using(from_user_id=(select auth.uid()) or to_user_id=(select auth.uid())
 or public.is_transaction_group_member(transaction_id));
create policy payment_history_read on public.payment_status_history for select to authenticated
using(exists(select 1 from public.member_bills mb where mb.id=payment_status_history.member_bill_id
 and (mb.user_id=(select auth.uid()) or public.is_transaction_group_member(mb.transaction_id))));

-- Budgets, alerts and analyses are private to their owner.
create policy budgets_owner_all on public.budgets for all to authenticated
using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy alerts_owner_all on public.budget_alerts for all to authenticated
using(public.is_budget_owner(budget_id)) with check(public.is_budget_owner(budget_id));
create policy analyses_owner_all on public.expense_analyses for all to authenticated
using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

-- BL-06: create group, add creator as owner, and create pending invitations.
-- Group, owner membership, and invitations are committed atomically.

create or replace function public.create_group_with_owner(
  p_name varchar,
  p_description text,
  p_user_id uuid,
  p_member_ids uuid[] default '{}'::uuid[],
  p_start_date date default null,
  p_end_date date default null,
  p_background_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group public.groups%rowtype;
  v_membership public.group_members%rowtype;
  v_invitations jsonb := '[]'::jsonb;
  v_requested_count integer;
  v_distinct_count integer;
  v_start_date date := coalesce(p_start_date, current_date);
begin
  if not exists (
    select 1 from public.profiles where id = p_user_id
  ) then
    raise exception 'USER_PROFILE_NOT_FOUND';
  end if;

  if p_end_date is not null and p_end_date < v_start_date then
    raise exception 'END_DATE_BEFORE_START_DATE';
  end if;

  if p_background_id is not null and not exists (
    select 1 from public.group_backgrounds
    where id = p_background_id and is_active = true
  ) then
    raise exception 'BACKGROUND_NOT_FOUND';
  end if;

  if p_member_ids is null then
    p_member_ids := '{}'::uuid[];
  end if;

  if p_user_id = any(p_member_ids) then
    raise exception 'CREATOR_CANNOT_BE_INVITED';
  end if;

  select count(*), count(distinct member_id)
    into v_requested_count, v_distinct_count
  from unnest(p_member_ids) as requested(member_id);

  if v_requested_count <> v_distinct_count then
    raise exception 'DUPLICATE_MEMBER_IDS';
  end if;

  if exists (
    select 1
    from unnest(p_member_ids) as requested(member_id)
    left join public.profiles p on p.id = requested.member_id
    where p.id is null
  ) then
    raise exception 'INVITED_PROFILE_NOT_FOUND';
  end if;

  insert into public.groups (
    name, description, created_by, start_date, end_date, background_id
  )
  values (
    p_name, p_description, p_user_id, v_start_date, p_end_date, p_background_id
  )
  returning * into v_group;

  insert into public.group_members (group_id, user_id, role, status)
  values (v_group.id, p_user_id, 'owner', 'active')
  returning * into v_membership;

  if cardinality(p_member_ids) > 0 then
    with inserted as (
      insert into public.group_invitations (
        group_id, invited_by, invited_user_id, status
      )
      select v_group.id, p_user_id, member_id, 'pending'
      from unnest(p_member_ids) as selected(member_id)
      returning id, group_id, invited_user_id, invite_code, status,
                expires_at, created_at
    )
    select coalesce(
      jsonb_agg(jsonb_build_object(
        'id', id,
        'group_id', group_id,
        'invited_user_id', invited_user_id,
        'invite_code', invite_code,
        'status', status,
        'expires_at', expires_at,
        'created_at', created_at
      )),
      '[]'::jsonb
    )
    into v_invitations
    from inserted;
  end if;

  return jsonb_build_object(
    'group', jsonb_build_object(
      'id', v_group.id,
      'name', v_group.name,
      'description', v_group.description,
      'join_code', v_group.join_code,
      'created_by', v_group.created_by,
      'start_date', v_group.start_date,
      'end_date', v_group.end_date,
      'background_id', v_group.background_id,
      'created_at', v_group.created_at,
      'updated_at', v_group.updated_at
    ),
    'membership', jsonb_build_object(
      'id', v_membership.id,
      'group_id', v_membership.group_id,
      'user_id', v_membership.user_id,
      'role', v_membership.role,
      'status', v_membership.status,
      'joined_at', v_membership.joined_at
    ),
    'invitations', v_invitations
  );
end;
$$;

-- Only the trusted backend service role may execute the RPC.
revoke all on function public.create_group_with_owner(
  varchar, text, uuid, uuid[], date, date, uuid
) from public, anon, authenticated;

grant execute on function public.create_group_with_owner(
  varchar, text, uuid, uuid[], date, date, uuid
) to service_role;

grant select on public.group_backgrounds to service_role;
grant select, insert on public.groups to service_role;
grant select, insert on public.group_members to service_role;
grant select, insert on public.group_invitations to service_role;

-- Backend service-role operations bypass RLS. Never expose service-role key in mobile app.
commit;