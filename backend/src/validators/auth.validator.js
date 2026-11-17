import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .email('Format email tidak valid')
  .transform((value) => value.toLowerCase());

export const registerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Nama minimal 2 karakter')
    .max(50, 'Nama maksimal 50 karakter'),

  email: emailSchema,

  password: z
    .string()
    .min(8, 'Password minimal 8 karakter'),
});

export const loginSchema = z.object({
  email: emailSchema,

  password: z
    .string()
    .min(1, 'Password wajib diisi'),
});

export const refreshSchema = z.object({
  refresh_token: z
    .string()
    .trim()
    .min(1, 'Refresh token wajib diisi'),
});

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2)
    .max(50),
});