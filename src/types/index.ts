import { Request } from 'express';
import { Role } from '@prisma/client';

/**
 * Extends the Express Request interface to include the authenticated user's payload.
 */
export interface AuthRequest extends Request {
  user?: JwtPayload; // The user property is optional
}

/**
 * Defines the structure of the JWT payload after decoding.
 */
export interface JwtPayload {
  id: string;
  role: Role;
}