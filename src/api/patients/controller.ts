import { Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import AppError from '../../utils/AppError';
import { AuthRequest } from '../../types/index';

export class PatientController {
    // Get patient profile
    async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params; // Patient profile ID
            const requesterId = req.user!.id;
            const requesterRole = req.user!.role;

            const patient = await prisma.patient.findUnique({
                where: { id },
                include: { user: { select: { fullName: true, email: true, phone: true } } }
            });

            if (!patient) return next(new AppError('Patient profile not found', 404));
            
            // Authorization: Patient can view their own, Receptionist can view any in their hospital
            if (requesterRole === 'PATIENT' && patient.userId !== requesterId) {
                return next(new AppError('Forbidden', 403));
            }
            // More complex logic for receptionist/doctor access would be needed here
            
            res.status(200).json({ status: 'success', data: patient });
        } catch (error) {
            next(error);
        }
    }

    // Update patient info
    async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const patient = await prisma.patient.findUnique({ where: { id } });

            if (!patient) return next(new AppError('Patient profile not found', 404));

            // Authorization: Patient or Receptionist can update
            if (req.user!.role === 'PATIENT' && req.user!.id !== patient.userId) {
                return next(new AppError('You are not authorized to update this profile', 403));
            }

            const updatedPatient = await prisma.patient.update({
                where: { id },
                data: req.body
            });
            res.status(200).json({ status: 'success', data: updatedPatient });
        } catch (error) {
            next(error);
        }
    }
}