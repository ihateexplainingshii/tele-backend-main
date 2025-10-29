import { Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import AppError from '../../utils/AppError';
import { AuthRequest } from '../../types';

export class ConsultationController {
  // Record a consultation (Doctor only)
  async recordConsultation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { appointmentId, doctorNotes, prescription, consultationType } = req.body;
      const doctorUserId = req.user!.id;

      const doctorProfile = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
      if (!doctorProfile) {
        return next(new AppError('Doctor profile not found.', 404));
      }

      const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
      if (!appointment || appointment.doctorId !== doctorProfile.id) {
        return next(new AppError('You are not the assigned doctor for this appointment.', 403));
      }
      
      const consultation = await prisma.consultation.create({
        data: { appointmentId, doctorNotes, prescription, consultationType },
      });

      // Optionally, update the appointment status to COMPLETED
      await prisma.appointment.update({ where: { id: appointmentId }, data: { status: 'COMPLETED' } });
      
      res.status(201).json({ status: 'success', data: consultation });
    } catch (error: any) {
        if (error.code === 'P2002') { // Unique constraint violation
            return next(new AppError('A consultation has already been recorded for this appointment.', 409));
        }
        next(error);
    }
  }

  // View consultation details (Patient or Doctor involved)
  async getConsultationDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params; // This is the Consultation ID
        const userId = req.user!.id;
        const userRole = req.user!.role;

        const consultation = await prisma.consultation.findUnique({
            where: { id },
            include: { appointment: { include: { patient: true, doctor: true } } }
        });

        if (!consultation) {
            return next(new AppError('Consultation not found', 404));
        }

        const isPatient = userRole === 'PATIENT' && consultation.appointment.patient.userId === userId;
        const isDoctor = userRole === 'DOCTOR' && consultation.appointment.doctor.userId === userId;

        if (!isPatient && !isDoctor) {
            return next(new AppError('You are not authorized to view these consultation details.', 403));
        }
        
        res.status(200).json({ status: 'success', data: consultation });
    } catch (error) {
        next(error);
    }
  }
}