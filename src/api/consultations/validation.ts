import { z } from 'zod';
import { AppointmentType } from '@prisma/client';

export const createConsultationSchema = z.object({
  body: z.object({
    appointmentId: z.string().uuid('Invalid appointment ID'),
    doctorNotes: z.string().min(10, 'Doctor notes must be at least 10 characters long'),
    prescription: z.string().optional(),
    consultationType: z.nativeEnum(AppointmentType),
  }),
});