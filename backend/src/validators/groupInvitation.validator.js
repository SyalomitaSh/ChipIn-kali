import { z } from 'zod';

const joinCodeSchema = z.string()
  .trim()
  .min(6)
  .max(30)
  .regex(/^[A-Za-z0-9-]+$/, 'Kode undangan tidak valid')
  .transform((value) => value.toUpperCase());

export const joinCodeParamsSchema = z.object({
  joinCode: joinCodeSchema,
}).strict();

export const joinGroupSchema = z.object({
  join_code: joinCodeSchema,
}).strict();
