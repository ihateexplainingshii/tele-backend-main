import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // --- HASH PASSWORDS ---
  const genericPassword = 'Password123!';
  const hashedPassword = await bcrypt.hash(genericPassword, 12);

  // --- 1. CREATE USERS with Different Roles ---
  console.log('Creating users...');
  const adminUser = await prisma.user.create({
    data: {
      fullName: 'System Admin',
      email: 'admin@telemed.rw',
      password: hashedPassword,
      phone: '0780000001',
      role: Role.ADMIN,
      status: 'ACTIVE',
      isEmailVerified: true,
    },
  });

  const hospitalAdminUser = await prisma.user.create({
    data: {
      fullName: 'Faisal Hospital Admin',
      email: 'hadmin@faisal.rw',
      password: hashedPassword,
      phone: '0780000002',
      role: Role.HOSPITAL_ADMIN,
      status: 'ACTIVE',
      isEmailVerified: true,
    },
  });

  const doctorUser1 = await prisma.user.create({
    data: {
      fullName: 'Dr. Aline UWERA',
      email: 'auwera@telemed.rw',
      password: hashedPassword,
      phone: '0780000003',
      role: Role.DOCTOR,
      status: 'ACTIVE',
      isEmailVerified: true,
    },
  });
  
  const doctorUser2 = await prisma.user.create({
    data: {
      fullName: 'Dr. Jean Bosco KABANDA',
      email: 'jkabanda@telemed.rw',
      password: hashedPassword,
      phone: '0780000004',
      role: Role.DOCTOR,
      status: 'ACTIVE',
      isEmailVerified: true,
    },
  });

  const receptionistUser = await prisma.user.create({
    data: {
      fullName: 'Marie Claire ISHIMWE',
      email: 'mishimwe@telemed.rw',
      password: hashedPassword,
      phone: '0780000005',
      role: Role.RECEPTIONIST,
      status: 'ACTIVE',
      isEmailVerified: true,
    },
  });
  
  const patientUser1 = await prisma.user.create({
    data: {
      fullName: 'Cedric MUGISHA',
      email: 'cmugisha@patient.rw',
      password: hashedPassword,
      phone: '0780000006',
      role: Role.PATIENT,
      status: 'ACTIVE',
      isEmailVerified: true,
    },
  });

  const patientUser2 = await prisma.user.create({
    data: {
      fullName: 'Annet UWASE',
      email: 'auwase@patient.rw',
      password: hashedPassword,
      phone: '0780000007',
      role: Role.PATIENT,
      status: 'PENDING', // One patient is pending for testing approval
      isEmailVerified: true,
    },
  });
  console.log('Users created successfully.');


  // --- 2. CREATE A HOSPITAL ---
  console.log('Creating hospital...');
  const kingFaisalHospital = await prisma.hospital.create({
    data: {
      name: 'King Faisal Hospital',
      licenseNumber: 'HSP-KGL-001',
      address: 'KG 544 St, Kigali, Rwanda',
      contactEmail: 'info@faisal.rw',
      contactPhone: '0788307565',
      adminId: hospitalAdminUser.id,
    },
  });
  console.log('Hospital created successfully.');


  // --- 3. CREATE DOCTOR PROFILES (Link User to Hospital) ---
  console.log('Creating doctor profiles...');
  const doctorProfile1 = await prisma.doctor.create({
    data: {
      userId: doctorUser1.id,
      hospitalId: kingFaisalHospital.id,
      specialization: 'Cardiology',
      licenseNumber: 'MD-CARD-001',
      consultationFee: 100, // Rwandan Francs
      availability: 'Mon, Wed, Fri (9am - 5pm)',
      status: 'AVAILABLE',
    },
  });

  const doctorProfile2 = await prisma.doctor.create({
    data: {
      userId: doctorUser2.id,
      hospitalId: kingFaisalHospital.id,
      specialization: 'Pediatrics',
      licenseNumber: 'MD-PED-002',
      consultationFee: 100,
      availability: 'Tue, Thu (8am - 12pm)',
      status: 'OFFLINE',
    },
  });
  console.log('Doctor profiles created successfully.');


  // --- 4. CREATE RECEPTIONIST PROFILE (Link User to Hospital) ---
  console.log('Creating receptionist profile...');
  const receptionistProfile = await prisma.receptionist.create({
    data: {
      userId: receptionistUser.id,
      hospitalId: kingFaisalHospital.id,
    },
  });
  console.log('Receptionist profile created successfully.');


  // --- 5. CREATE PATIENT PROFILES (Link User to Hospital) ---
  console.log('Creating patient profiles...');
  const patientProfile1 = await prisma.patient.create({
    data: {
      userId: patientUser1.id,
      hospitalId: kingFaisalHospital.id,
      dateOfBirth: new Date('1992-05-20T00:00:00Z'),
      gender: 'MALE',
      bloodType: 'A+',
      insuranceProvider: 'Radiant',
      insuranceNumber: 'RAD-12345-01',
      status: 'ACTIVE',
    },
  });

  const patientProfile2 = await prisma.patient.create({
    data: {
      userId: patientUser2.id,
      hospitalId: kingFaisalHospital.id,
      dateOfBirth: new Date('1988-11-10T00:00:00Z'),
      gender: 'FEMALE',
      bloodType: 'O-',
      status: 'PENDING',
    },
  });
  console.log('Patient profiles created successfully.');

  // =================================================================
  // --- 6. CREATE APPOINTMENTS, CONSULTATIONS, PAYMENTS & NOTIFICATIONS ---
  // =================================================================
  console.log('Creating appointments and related data...');

  // Scenario 1: A completed appointment with consultation and payment
  const appointment1 = await prisma.appointment.create({
    data: {
      patientId: patientProfile1.id,
      doctorId: doctorProfile1.id,
      hospitalId: kingFaisalHospital.id,
      receptionistId: receptionistProfile.id,
      appointmentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      type: 'VIDEO',
      status: 'COMPLETED',
    },
  });

  const consultation1 = await prisma.consultation.create({
    data: {
      appointmentId: appointment1.id,
      doctorNotes: 'Patient presented with mild chest pain. EKG results are normal. Recommended rest and follow-up in one week.',
      prescription: 'Ibuprofen 400mg, as needed for pain.',
      consultationType: 'VIDEO',
    },
  });

  const payment1 = await prisma.payment.create({
    data: {
      appointmentId: appointment1.id,
      patientId: patientProfile1.id,
      amount: doctorProfile1.consultationFee,
      method: 'INSURANCE',
      status: 'PAID',
    },
  });

  // Scenario 2: A confirmed, upcoming appointment
  const appointment2 = await prisma.appointment.create({
    data: {
      patientId: patientProfile1.id,
      doctorId: doctorProfile2.id,
      hospitalId: kingFaisalHospital.id,
      receptionistId: receptionistProfile.id,
      appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      type: 'AUDIO',
      status: 'CONFIRMED',
    },
  });

  // Scenario 3: A pending appointment (waiting for confirmation)
  const appointment3 = await prisma.appointment.create({
    data: {
      patientId: patientProfile1.id,
      doctorId: doctorProfile1.id,
      hospitalId: kingFaisalHospital.id,
      receptionistId: receptionistProfile.id,
      appointmentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      type: 'CHAT',
      status: 'PENDING',
    },
  });

  console.log('Appointments and related data created successfully.');

  // --- 7. CREATE NOTIFICATIONS ---
  console.log('Creating notifications...');
  await prisma.notification.createMany({
    data: [
      // Notification for the patient about their upcoming appointment
      {
        userId: patientUser1.id,
        message: `Your appointment with Dr. Jean Bosco KABANDA is confirmed for ${appointment2.appointmentDate.toDateString()}.`,
        type: 'INFO',
      },
      // Reminder for the doctor
      {
        userId: doctorUser2.id,
        message: `Reminder: You have an appointment with Cedric MUGISHA on ${appointment2.appointmentDate.toDateString()}.`,
        type: 'REMINDER',
        status: 'SENT',
      },
      // Unread notification for the patient
      {
        userId: patientUser1.id,
        message: 'Your consultation notes from your recent visit are available to view.',
        type: 'ALERT',
        status: 'SENT', // Patient has not read it yet
      },
    ],
  });
  console.log('Notifications created successfully.');

  console.log('✅ Seeding finished successfully!');
}

main()
  .catch(async (e) => {
    console.error('❌ An error occurred while seeding the database:', e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });