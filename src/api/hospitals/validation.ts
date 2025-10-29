import { z } from 'zod';

export const createHospitalSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    licenseNumber: z.string().min(1),
    address: z.string().min(5),
    contactEmail: z.string().email(),
    contactPhone: z.string().min(10),
    adminId: z.string().uuid('Invalid Hospital Admin ID'),
  }),
});

export const updateHospitalSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    licenseNumber: z.string().min(1).optional(),
    address: z.string().min(5).optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().min(10).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});