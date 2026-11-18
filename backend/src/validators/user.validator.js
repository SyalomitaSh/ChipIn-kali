import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Nama minimal 2 karakter')
    .max(50, 'Nama maksimal 50 karakter')
    .optional(),
}).strict();
