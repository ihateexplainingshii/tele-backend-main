import { Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import AppError from '../../utils/AppError';
import { AuthRequest } from '../../types';

export class ReportController {
  // Generate a report for a specific hospital
  async getHospitalReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // hospitalId
      // Authorization check (can be expanded)
      
      const appointments = await prisma.appointment.count({ where: { hospitalId: id } });
      const doctors = await prisma.doctor.count({ where: { hospitalId: id } });
      const patients = await prisma.patient.count({ where: { hospitalId: id } });
      const earnings = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { appointment: { hospitalId: id }, status: 'PAID' }
      });
      
      res.status(200).json({ status: 'success', data: {
          totalAppointments: appointments,
          totalDoctors: doctors,
          totalPatients: patients,
          totalEarnings: earnings._sum.amount || 0
      }});
    } catch (error) {
      next(error);
    }
  }

  // Generate a system-wide report (Admin only)
  async getSystemReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const totalUsers = await prisma.user.count();
      const totalHospitals = await prisma.hospital.count();
      const totalAppointments = await prisma.appointment.count();
      const totalEarnings = await prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'PAID' }
      });

      res.status(200).json({ status: 'success', data: {
          totalUsers,
          totalHospitals,
          totalAppointments,
          totalEarnings: totalEarnings._sum.amount || 0
      }});
    } catch (error) {
      next(error);
    }
  }
}