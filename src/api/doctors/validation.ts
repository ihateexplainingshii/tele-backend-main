import { z } from 'zod';
import { DoctorStatus } from '@prisma/client';

export const addDoctorSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    hospitalId: z.string().uuid(),
    specialization: z.string().min(3),
    licenseNumber: z.string().min(1),
    availability: z.string().optional(),
    consultationFee: z.number().positive(),
  }),
});

export const updateDoctorSchema = z.object({
  body: z.object({
    specialization: z.string().min(3).optional(),
    availability: z.string().optional(),
    consultationFee: z.number().positive().optional(),
    status: z.nativeEnum(DoctorStatus).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});