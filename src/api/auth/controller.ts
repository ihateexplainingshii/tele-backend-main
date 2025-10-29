import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role, Gender } from '@prisma/client';
import prisma from '../../config/prisma';
import { sendVerificationEmail } from '../../services/email';
import { AuthRequest } from '../../types/index';

export class AuthController {
  // /**
  //  * Handles public registration for new PATIENTS.
  //  * Sends a verification email with a token that defaults the user role to PATIENT.
  //  */
  // async registerPatient(req: Request, res: Response): Promise<Response> {
  //   const { fullName, email, password, phone } = req.body;

  //   try {
  //     const existingUser = await prisma.user.findUnique({ where: { email } });
  //     if (existingUser) {
  //       return res.status(409).json({ message: 'User with this email already exists' });
  //     }

  //     const hashedPassword = await bcrypt.hash(password, 12);
  //     const SECRET = process.env.JWT_SECRET!;

  //     // The payload for a public registration *always* specifies the role as PATIENT
  //     const verificationPayload = {
  //       email,
  //       password: hashedPassword,
  //       role: Role.PATIENT, // Explicitly set role for this flow
  //     };
      
  //     const token = jwt.sign(verificationPayload, SECRET, { expiresIn: '15m' });

  //     await sendVerificationEmail(email, token);

  //     return res.status(201).json({ message: 'Verification email sent. Please check your inbox to activate your account.' });
  //   } catch (err) {
  //     console.error('Patient registration error:', err);
  //     return res.status(500).json({ message: 'Internal server error' });
  //   }
  // }

   /**
   * Final step of the invitation process.
   * Creates a user account from a valid invitation token and user-provided details.
   */
  async completeInvitation(req: Request, res: Response) {
    const { token, fullName, phone, password, specialization,
      licenseNumber, consultationFee, dateOfBirth, gender } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Invitation token is required.' });
    }

    try {
      const SECRET = process.env.JWT_SECRET!;
      const decoded = jwt.verify(token, SECRET) as {
        email: string;
        role: Role;
        hospitalId?: string;
      };
      
      const { email, role, hospitalId } = decoded;
      
      if (!Object.values(Role).includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified in token.' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: 'This email is already registered.' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      // Use a transaction to create the User AND their role-specific profile
      await prisma.$transaction(async (tx) => {
        // Create the base User record
        const user = await tx.user.create({
          data: {
            email,
            fullName,
            phone,
            password: hashedPassword,
            role,
            status: 'ACTIVE',
            isEmailVerified: true,
          },
        });

        // Create the role-specific profile based on the role from the token
        switch (role) {
          case Role.DOCTOR:
            if (!specialization || !licenseNumber || consultationFee === undefined) {
              // This is a server-side validation check
              throw new Error('Doctor profile requires specialization, license number, and consultation fee.');
            }
            await tx.doctor.create({
              data: { 
                userId: user.id, 
                hospitalId: hospitalId!, // Assumes a doctor invite always includes a hospital
                specialization, 
                licenseNumber, 
                consultationFee: parseFloat(consultationFee),
              }
            });
            break;

          case Role.RECEPTIONIST:
            // No extra data needed for receptionists at signup
            await tx.receptionist.create({ 
              data: { userId: user.id, hospitalId: hospitalId! } 
            });
            break;

          case Role.PATIENT:
            if (!dateOfBirth || !gender) {
              throw new Error('Patient profile requires date of birth and gender.');
            }
            await tx.patient.create({
              data: { 
                userId: user.id, 
                hospitalId, // Can be null if it's a public registration
                dateOfBirth: new Date(dateOfBirth), 
                gender: gender as Gender,
              }
            });
            break;
            
          case Role.HOSPITAL_ADMIN:
            // No extra profile table for Hospital Admins, so we do nothing here.
            break;
        }
      });
      
      res.status(201).json({
        status: 'success',
        message: 'Account data saved successfully.',
      });

    } catch (err: any) {
      console.error('Invitation completion error:', err);
      // Handle transaction errors (e.g., from our custom throw)
      if (err.message.includes('profile requires')) {
          return res.status(400).json({ message: err.message });
      }
      if (err.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Your invitation link has expired. Please request a new one.' });
      }
      return res.status(400).json({ message: 'Invalid invitation link or missing required data.' });
    }
  }

  /**
   * Verifies an email token and creates a new user with the role specified in the token.
   * This single endpoint can handle verifications for patients, doctors, etc.,
   * because the role is securely embedded in the JWT by the function that initiated the invite.
   */
  // async verifyEmail(req: Request, res: Response) {
  //   const { token } = req.query;

  //   if (!token || typeof token !== 'string') {
  //     return res.status(400).send('<h1>Error</h1><p>A verification token is required.</p>');
  //   }

  //   try {
  //     const SECRET = process.env.JWT_SECRET!;
  //     // Define the expected shape of the decoded payload
  //     const decoded = jwt.verify(token, SECRET) as {
  //       fullName: string;
  //       email: string;
  //       password: string;
  //       phone: string;
  //       role: Role; // We expect the role to be in the token
  //       hospitalId?: string; // Optional: for invited staff/patients
  //     };
      
  //     const { fullName, email, password, phone, role, hospitalId } = decoded;
      
  //     if (!Object.values(Role).includes(role)) {
  //       return res.status(400).send('<h1>Error</h1><p>Invalid role specified in token.</p>');
  //     }

  //     const existingUser = await prisma.user.findUnique({ where: { email } });
  //     if (existingUser) {
  //       return res.status(409).send('<h1>Error</h1><p>This email is already registered. Please log in.</p>');
  //     }

  //     // Use a transaction to create the User and potentially their profile (Doctor, Patient, etc.)
  //     const user = await prisma.user.create({
  //       data: {
  //         fullName,
  //         email,
  //         password,
  //         phone,
  //         role,
  //         status: 'ACTIVE',
  //         isEmailVerified: true,
  //       },
  //     });

  //     // If a hospitalId was included in the invite, create the corresponding profile
  //     if (hospitalId) {
  //       switch (role) {
  //         case Role.DOCTOR:
  //           // For a real app, license number etc. would be collected in a second step.
  //           // For this invite, we create a placeholder profile.
  //           await prisma.doctor.create({
  //             data: { userId: user.id, hospitalId, specialization: 'Pending', licenseNumber: `TEMP-${user.id}`, consultationFee: 0 }
  //           });
  //           break;
  //         case Role.RECEPTIONIST:
  //           await prisma.receptionist.create({ data: { userId: user.id, hospitalId } });
  //           break;
  //         case Role.PATIENT:
  //           await prisma.patient.create({
  //             data: { userId: user.id, hospitalId, dateOfBirth: new Date(), gender: 'OTHER' }
  //           });
  //           break;
  //       }
  //     }
      
  //     const successHtml = `
  //     <!DOCTYPE html><html><head><title>Success</title><style>body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background-color:#f0f9ff}.container{text-align:center;padding:40px;background:white;border-radius:12px;box-shadow:0 8px 16px rgba(0,0,0,.1)}.icon{color:#22c55e;font-size:60px}h1{color:#1e3a8a}p{color:#374151}</style></head><body><div class="container"><div class="icon">✓</div><h1>Email Verified!</h1><p>Your account for the role of <strong>${role}</strong> has been created. You may now log in.</p></div></body></html>`;
  //     return res.send(successHtml);

  //   } catch (err: any) {
  //     console.error('Verification error:', err);
  //     if (err.name === 'TokenExpiredError') {
  //       return res.status(400).send('<h1>Error</h1><p>Verification link has expired. Please try again.</p>');
  //     }
  //     return res.status(400).send('<h1>Error</h1><p>Invalid verification link.</p>');
  //   }
  // }

  /**
   * Log in a user.
   */
  async login(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (!user.isEmailVerified) {
        return res.status(403).json({ message: 'Your email is not verified. Please check your inbox for the verification link.' });
      }

      if (user.status !== 'ACTIVE') {
        return res.status(403).json({ message: 'Your account is not active. Please contact support.' });
      }

      const SECRET = process.env.JWT_SECRET as string;
      const token = jwt.sign({ id: user.id, role: user.role }, SECRET, {
        expiresIn: '1d',
      });

      const { password: _, ...userData } = user;
      return res.status(200).json({ token, user: userData });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * Get the profile of the currently authenticated user.
   */
  async me(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user?.id },
        select: { id: true, fullName: true, email: true, role: true, phone: true, status: true },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json(user);
    } catch (err) {
      console.error('Get profile error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * Log out a user (client-side implementation).
   */
  async logout(_req: Request, res: Response): Promise<Response> {
    return res.status(200).json({ message: 'Logged out successfully.' });
  }
}