import { Router } from 'express';
import { AppointmentController } from './controller';
import { authenticateToken, authorize } from '../../middleware/auth';

const router = Router();
const appointmentController = new AppointmentController();

/**
 * @openapi
 * tags:
 *   name: Appointments
 *   description: Scheduling and managing patient appointments.
 */

router.use(authenticateToken);

/**
 * @openapi
 * /appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     description: Allows a Patient to book an appointment for themselves, or a Receptionist to book one for a patient.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, doctorId, hospitalId, appointmentDate, type]
 *             properties:
 *               patientId: { type: string, format: uuid, description: "The UUID of the patient's profile." }
 *               doctorId: { type: string, format: uuid, description: "The UUID of the doctor's profile." }
 *               hospitalId: { type: string, format: uuid, description: "The UUID of the hospital where the appointment is." }
 *               appointmentDate: { type: string, format: "date-time", example: "2024-08-20T14:30:00Z" }
 *               type: { type: string, enum: [VIDEO, AUDIO, CHAT], example: "VIDEO" }
 *     responses:
 *       '201': { description: "Appointment created successfully." }
 *       '403': { description: "Forbidden. You cannot book appointments for other patients." }
 */
router.post('/', authorize(['PATIENT', 'RECEPTIONIST']), appointmentController.createAppointment);

/**
 * @openapi
 * /appointments:
 *   get:
 *     summary: List appointments
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     description: |
 *       Retrieves a list of appointments. The list is automatically filtered based on the user's role:
 *       - **Patient**: Sees their own appointments.
 *       - **Doctor**: Sees appointments assigned to them.
 *       - **Receptionist/Admin**: Sees all appointments for their hospital.
 *     responses:
 *       '200': { description: "A list of appointments." }
 */
router.get('/', appointmentController.listAppointments);

/**
 * @openapi
 * /appointments/{id}/status:
 *   patch:
 *     summary: Update an appointment's status
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     description: Allows a Receptionist or Doctor to update the status of an appointment (e.g., confirm, cancel, complete).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: The UUID of the appointment to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED], example: "CONFIRMED" }
 *     responses:
 *       '200': { description: "Appointment status updated successfully." }
 *       '403': { description: "Forbidden. Not authorized to change status." }
 *       '404': { description: "Appointment not found." }
 */
router.patch('/:id/status', authorize(['RECEPTIONIST', 'DOCTOR']), appointmentController.updateStatus);

export default router;