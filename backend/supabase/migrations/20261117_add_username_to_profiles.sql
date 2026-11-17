-- Migration: tambahkan username ke public.profiles.
-- Jalankan satu kali melalui Supabase Dashboard -> SQL Editor.
-- Backup database sebelum menjalankan migration pada project yang sudah berisi data.

alter table public.profiles
  add column if not exists username text;

-- Backfill akun lama dengan username berbasis email + suffix UUID
-- agar setiap username tetap unik dan memenuhi panjang minimal.
update public.profiles p
set username =
  left(
    coalesce(
      nullif(
        trim(both '_' from regexp_replace(
          lower(split_part(coalesce(u.email, ''), '@', 1)),
          '[^a-z0-9_]', '_', 'g'
        )),
        ''
      ),
      'user'
    ),
    20
  ) || '_' || left(replace(p.id::text, '-', ''), 8)
from auth.users u
where u.id = p.id
  and (p.username is null or btrim(p.username) = '');

-- Sinkronkan username akun lama ke user_metadata agar response Login
-- yang memakai formatter Supabase Auth juga memiliki username.
update auth.users u
set raw_user_meta_data =
  coalesce(u.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('username', p.username)
from public.profiles p
where p.id = u.id;

-- Username unik tanpa membedakan huruf besar/kecil.
create unique index if not exists profiles_username_lower_uidx
  on public.profiles (lower(username));

alter table public.profiles
  alter column username set not null;

-- Trigger untuk user baru. Username dari metadata adalah sumber utama.
-- Fallback hanya untuk pendaftaran yang tidak mengirim username.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_username text;
begin
  generated_username := lower(
    coalesce(
      nullif(btrim(new.raw_user_meta_data->>'username'), ''),
      left(
        coalesce(
          nullif(
            trim(both '_' from regexp_replace(
              lower(split_part(coalesce(new.email, ''), '@', 1)),
              '[^a-z0-9_]', '_', 'g'
            )),
            ''
          ),
          'user'
        ),
        20
      ) || '_' || left(replace(new.id::text, '-', ''), 8)
    )
  );

  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    generated_username,
    coalesce(
      nullif(btrim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(coalesce(new.email, ''), '@', 1)
    )
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
