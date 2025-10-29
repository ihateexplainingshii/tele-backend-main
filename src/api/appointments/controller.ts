import { Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import AppError from '../../utils/AppError';
import { AuthRequest } from '../../types/index';

export class AppointmentController {
    // Create a new appointment
    async createAppointment(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { patientId, doctorId, hospitalId, appointmentDate, type } = req.body;
            const requesterId = req.user!.id;
            let receptionistId;

            if (req.user!.role === 'RECEPTIONIST') {
                const receptionist = await prisma.receptionist.findUnique({ where: { userId: requesterId } });
                if (!receptionist) return next(new AppError('Receptionist profile not found.', 404));
                receptionistId = receptionist.id;
            } else if (req.user!.role === 'PATIENT') {
                const patient = await prisma.patient.findUnique({ where: { userId: requesterId }});
                if (!patient || patient.id !== patientId) {
                    return next(new AppError('You can only book appointments for yourself.', 403));
                }
            }

            const appointment = await prisma.appointment.create({
                data: { patientId, doctorId, hospitalId, appointmentDate, type, receptionistId }
            });

            res.status(201).json({ status: 'success', data: appointment });
        } catch (error) {
            next(error);
        }
    }

    // List appointments with filtering by role
    async listAppointments(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const where: Prisma.AppointmentWhereInput = {};
            const user = req.user!;

            if (user.role === 'PATIENT') {
                const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
                if (patient) where.patientId = patient.id;
            } else if (user.role === 'DOCTOR') {
                const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
                if (doctor) where.doctorId = doctor.id;
            } else if (user.role === 'RECEPTIONIST') {
                const receptionist = await prisma.receptionist.findUnique({ where: { userId: user.id } });
                if (receptionist) where.hospitalId = receptionist.hospitalId;
            }

            const appointments = await prisma.appointment.findMany({
                where,
                include: { patient: { include: { user: true } }, doctor: { include: { user: true } } }
            });
            res.status(200).json({ status: 'success', data: appointments });
        } catch (error) {
            next(error);
        }
    }

    // Update appointment state
    async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const updatedAppointment = await prisma.appointment.update({
                where: { id },
                data: { status }
            });
            res.status(200).json({ status: 'success', data: updatedAppointment });
        } catch (error) {
            next(error);
        }
    }
}