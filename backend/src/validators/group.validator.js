import { z } from 'zod';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const dateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Tanggal harus berformat YYYY-MM-DD'
  )
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, 'Tanggal tidak valid');

export const createGroupSchema = z.object({
  name: z.string()
    .trim()
    .min(2)
    .max(100),

  description: z.string()
    .trim()
    .max(500)
    .nullable()
    .optional(),

  start_date: dateSchema.optional(),

  end_date: dateSchema
    .nullable()
    .optional(),

  background_id: z.string()
    .uuid()
    .nullable()
    .optional(),

  member_ids: z.array(z.string().uuid())
    .max(100)
    .default([])
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Tidak boleh ada anggota yang sama',
    }),
}).strict().refine(
  (data) =>
    !data.start_date ||
    !data.end_date ||
    data.end_date >= data.start_date,
  {
    message: 'Tanggal selesai tidak boleh sebelum tanggal mulai',
    path: ['end_date'],
  }
);