import { Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import AppError from '../../utils/AppError';
import { AuthRequest } from '../../types/index';

// POST /hospitals - Register a new hospital (Admin only)
export const createHospital = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, licenseNumber, address, contactEmail, contactPhone, adminId } = req.body;

    // Check if the assigned admin exists and has the correct role
    const hospitalAdmin = await prisma.user.findFirst({
        where: { id: adminId, role: 'HOSPITAL_ADMIN' }
    });

    if (!hospitalAdmin) {
        return next(new AppError('The specified user is not a valid hospital administrator.', 400));
    }

    const hospital = await prisma.hospital.create({
      data: { name, licenseNumber, address, contactEmail, contactPhone, adminId },
    });
    res.status(201).json({ status: 'success', data: hospital });
  } catch (error) {
    next(error);
  }
};

// GET /hospitals - List all hospitals
export const getAllHospitals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const hospitals = await prisma.hospital.findMany({ include: { admin: { select: { fullName: true } } } });
    res.status(200).json({ status: 'success', results: hospitals.length, data: hospitals });
  } catch (error) {
    next(error);
  }
};

// GET /hospitals/:id - View hospital details
export const getHospitalById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const hospital = await prisma.hospital.findUnique({
      where: { id },
      include: { doctors: true, receptionists: true, patients: true }
    });
    if (!hospital) {
      return next(new AppError('Hospital not found', 404));
    }
    res.status(200).json({ status: 'success', data: hospital });
  } catch (error) {
    next(error);
  }
};

// PATCH /hospitals/:id - Update hospital info
export const updateHospital = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const hospital = await prisma.hospital.findUnique({ where: { id } });

    if (!hospital) {
        return next(new AppError('Hospital not found', 404));
    }
    
    // Authorization check: Only a system ADMIN or the hospital's own ADMIN can update it.
    if (req.user?.role !== 'ADMIN' && hospital.adminId !== req.user?.id) {
        return next(new AppError('You are not authorized to update this hospital', 403));
    }

    const updatedHospital = await prisma.hospital.update({
      where: { id },
      data: req.body,
    });
    res.status(200).json({ status: 'success', data: updatedHospital });
  } catch (error) {
    next(error);
  }
};

// DELETE /hospitals/:id - Delete a hospital (Admin only)
export const deleteHospital = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.hospital.delete({ where: { id } });
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    // Handle cases where deletion is not possible due to foreign key constraints
    next(new AppError('Could not delete hospital. It may have associated staff or patients.', 409));
  }
};