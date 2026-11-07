import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(2, "Username minimal 2 karakter")
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya huruf, angka, dan underscore"),
  password: z
    .string()
    .min(4, "Password/PIN minimal 4 karakter")
    .max(100),
});

export const ritasiUpsertSchema = z.object({
  haulerId: z.string().cuid(),
  material: z.enum(["OB", "COAL", "SOIL", "SOLU", "MUD"]),
  trips: z.number().int().min(0).max(999),
  shift: z.enum(["PAGI", "SIANG", "MALAM"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD"),
  ritasiTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Format waktu HH:MM atau HH:MM:SS")
    .optional()
    .nullable(),
  keterangan: z.string().max(500).optional().nullable(),
});

export const pitSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(1).max(10).toUpperCase(),
  description: z.string().max(500).optional().nullable(),
});

export const fleetSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(1).max(10),
  pitId: z.string().cuid(),
});

export const haulerSchema = z.object({
  unitNumber: z.string().min(2).max(20),
  type: z.string().min(2).max(100),
  capacity: z.number().positive().optional().nullable(),
  fleetId: z.string().cuid(),
});

export const userSchema = z.object({
  username: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/),
  name: z.string().min(2).max(100),
  role: z.enum(["ADMIN", "PENGAWAS"]),
  pitId: z.string().cuid().optional().nullable(),
  password: z.string().min(4).max(100),
});

export const userUpdateSchema = userSchema.partial().extend({
  password: z.string().min(4).max(100).optional(),
});
