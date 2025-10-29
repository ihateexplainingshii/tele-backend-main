import { Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import AppError from '../../utils/AppError';
import { AuthRequest } from '../../types/index';

export class DoctorController {
  // Add a doctor to a hospital (Hospital Admin only)
  async addDoctor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId, hospitalId, specialization, licenseNumber, availability, consultationFee } = req.body;
      const hospitalAdminId = req.user!.id;

      // Ensure the user being added is a DOCTOR
      const user = await prisma.user.findFirst({
        where: { id: userId, role: 'DOCTOR' }
      });
      if (!user) {
        return next(new AppError('The specified user is not a valid doctor.', 400));
      }

      // Ensure the hospital admin is adding a doctor to their OWN hospital
      const hospital = await prisma.hospital.findFirst({
        where: { id: hospitalId, adminId: hospitalAdminId }
      });
      if (!hospital) {
        return next(new AppError('You are not authorized to add doctors to this hospital.', 403));
      }
      
      const doctor = await prisma.doctor.create({
        data: { userId, hospitalId, specialization, licenseNumber, availability, consultationFee }
      });
      res.status(201).json({ status: 'success', data: doctor });
    } catch (error: any) {
        if (error.code === 'P2002') { // Unique constraint violation
            return next(new AppError('This user is already registered as a doctor or license number is taken.', 409));
        }
        next(error);
    }
  }

  // List doctors (can be filtered by hospital or specialization)
  async listDoctors(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { hospitalId, specialization } = req.query;
      const where: any = {};
      if (hospitalId) where.hospitalId = hospitalId as string;
      if (specialization) where.specialization = { contains: specialization as string, mode: 'insensitive' };
      
      const doctors = await prisma.doctor.findMany({
        where,
        include: { user: { select: { fullName: true, email: true } }, hospital: { select: { name: true } } }
      });
      res.status(200).json({ status: 'success', results: doctors.length, data: doctors });
    } catch (error) {
      next(error);
    }
  }

  // Update doctor info or availability (Doctor themselves or Hospital Admin)
  async updateDoctor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doctor = await prisma.doctor.findUnique({ where: { id } });

      if (!doctor) {
        return next(new AppError('Doctor not found', 404));
      }

      // Authorization: Check if updater is the doctor or their hospital's admin
      const hospital = await prisma.hospital.findUnique({ where: { id: doctor.hospitalId } });
      if (req.user?.id !== doctor.userId && req.user?.id !== hospital?.adminId) {
        return next(new AppError('You are not authorized to update this profile.', 403));
      }
      
      const updatedDoctor = await prisma.doctor.update({ where: { id }, data: req.body });
      res.status(200).json({ status: 'success', data: updatedDoctor });
    } catch (error) {
      next(error);
    }
  }

  // Remove a doctor (Hospital Admin only)
  async removeDoctor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const hospitalAdminId = req.user!.id;

      const doctor = await prisma.doctor.findUnique({ where: { id } });
      if (!doctor) {
        return next(new AppError('Doctor not found', 404));
      }

      const hospital = await prisma.hospital.findFirst({
        where: { id: doctor.hospitalId, adminId: hospitalAdminId }
      });
      if (!hospital) {
        return next(new AppError('You are not authorized to remove doctors from this hospital.', 403));
      }

      await prisma.doctor.delete({ where: { id } });
      res.status(204).json({ status: 'success', data: null });
    } catch (error) {
      next(error);
    }
  }
}