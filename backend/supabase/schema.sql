-- Jalankan di Supabase -> SQL Editor.
-- Skema awal untuk Sprint 1-3 (auth, profil, grup). Tabel transaksi/OCR ditambah di sprint berikutnya.

-- PROFILES (BL-01, BL-03): 1 baris per user di auth.users
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  created_at  timestamptz not null default now()
);

-- Otomatis buat profil saat user registrasi (nama diambil dari metadata signUp)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(
  nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- GROUPS (BL-06)
create table if not exists public.groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  event_date   date,
  invite_code  text not null unique,
  created_by   uuid not null references public.profiles(id),
  created_at   timestamptz not null default now()
);

-- GROUP MEMBERS (BL-04, BL-07): pembuat grup otomatis jadi admin
create table if not exists public.group_members (
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'member' check (role in ('admin', 'member')),
  joined_at  timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists idx_group_members_user on public.group_members(user_id);

-- Semua akses data lewat backend (service role, bypass RLS).
-- RLS tanpa policy = klien yang memakai anon key tidak bisa baca/tulis langsung.
alter table public.profiles       enable row level security;
alter table public.groups         enable row level security;
alter table public.group_members  enable row level security;
