import { Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { Role } from '@prisma/client';
import AppError from '../../utils/AppError';
import { AuthRequest } from '../../types/index';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '../../services/email';
import jwt from 'jsonwebtoken';

export class ReceptionistController {
  // Register a new receptionist (Hospital Admin only)
  async addReceptionist(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId, hospitalId } = req.body;
      const hospitalAdminId = req.user!.id;

      const user = await prisma.user.findFirst({ where: { id: userId, role: 'RECEPTIONIST' } });
      if (!user) return next(new AppError('The specified user is not a valid receptionist.', 400));

      const hospital = await prisma.hospital.findFirst({ where: { id: hospitalId, adminId: hospitalAdminId } });
      if (!hospital) return next(new AppError('You are not authorized to add staff to this hospital.', 403));
      
      const receptionist = await prisma.receptionist.create({ data: { userId, hospitalId } });
      res.status(201).json({ status: 'success', data: receptionist });
    } catch (error: any) {
        if (error.code === 'P2002') return next(new AppError('This user is already a receptionist.', 409));
        next(error);
    }
  }

  // List all receptionists for a hospital
  async listReceptionists(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { hospitalId } = req.query;
        if (!hospitalId) return next(new AppError('Hospital ID is required.', 400));

        const receptionists = await prisma.receptionist.findMany({
            where: { hospitalId: hospitalId as string },
            include: { user: { select: { fullName: true, email: true } } }
        });
        res.status(200).json({ status: 'success', data: receptionists });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Invite a new patient to the platform.
   * This is initiated by a logged-in Receptionist.
   */
  async invitePatient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const receptionistUserId = req.user!.id;

      // Find the receptionist's profile to get their hospital ID
      const receptionist = await prisma.receptionist.findUnique({
        where: { userId: receptionistUserId },
      });
      if (!receptionist) {
        return next(new AppError('Receptionist profile not found.', 404));
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return next(new AppError('A user with this email already exists.', 409));
      }
      
      // Invited users don't set their own password initially. We create a secure, temporary one.
      const hashedPassword = await bcrypt.hash('Password123!', 12);
      
      const verificationPayload = {
        email,
        password: hashedPassword,
        role: Role.PATIENT, // Securely set the role
        hospitalId: receptionist.hospitalId, // Link the patient to this hospital
      };
      
      const token = jwt.sign(verificationPayload, process.env.JWT_SECRET!, { expiresIn: '24h' });

      // We might want a different email template for invites, but this works for now.
      await sendVerificationEmail(email, token);

      res.status(200).json({ status: 'success', message: `Invitation sent to ${email}.` });
    } catch (error) {
      next(error);
    }
  }

  // // approvePatient logic is now handled by the verifyEmail flow,
  // // as invited patients are created with ACTIVE status. This function can be removed or kept for legacy pending users.
  // async approvePatient(req: AuthRequest, res: Response, next: NextFunction) {
  //   try {
  //     const { id: userId } = req.params; // The ID here is the User ID

  //     const user = await prisma.user.findUnique({ where: { id: userId } });
  //     if (!user || user.role !== 'PATIENT' || user.status !== 'PENDING') {
  //       return next(new AppError('No pending patient found with this ID.', 404));
  //     }
      
  //     const updatedUser = await prisma.user.update({
  //         where: { id: userId },
  //         data: { status: 'ACTIVE' }
  //     });
  //     res.status(200).json({ status: 'success', message: `Patient ${updatedUser.fullName} has been approved.` });
  //   } catch (error) {
  //       next(error);
  //   }
  // }
}