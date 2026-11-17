import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const stateless = { auth: { persistSession: false, autoRefreshToken: false } };

// Akses penuh ke DB (bypass RLS). HANYA dipakai di backend.
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  stateless
);

// Client baru per request untuk operasi auth (signUp/signIn),
// supaya sesi satu pengguna tidak bocor ke request lain.
export const createAnonClient = () =>
  createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, stateless);
