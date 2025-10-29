import { z } from 'zod';

export const addReceptionistSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    hospitalId: z.string().uuid(),
  }),
});

export const invitePatientSchema = z.object({
    body: z.object({
        email: z.string().email(),
        fullName: z.string().min(2),
        phone: z.string().min(10),
    }),
});