import { Router } from 'express';
import { ConsultationController } from './controller';
import { authenticateToken, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createConsultationSchema } from './validation';

const router = Router();
const consultationController = new ConsultationController();

/**
 * @openapi
 * tags:
 *   name: Consultations
 *   description: Managing medical consultation records post-appointment.
 */

router.use(authenticateToken);

/**
 * @openapi
 * /consultations:
 *   post:
 *     summary: Record a new consultation
 *     tags: [Consultations]
 *     security: [{ bearerAuth: [] }]
 *     description: Allows a Doctor to record the details of a completed appointment, such as notes and prescriptions.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appointmentId: { type: string, format: uuid }
 *               doctorNotes: { type: string }
 *               prescription: { type: string }
 *               consultationType: { type: string, enum: [VIDEO, AUDIO, CHAT] }
 *     responses:
 *       '201': { description: "Consultation recorded successfully." }
 *       '403': { description: "Forbidden. User is not the assigned doctor." }
 *       '409': { description: "A consultation for this appointment already exists." }
 */
router.post('/', authorize(['DOCTOR']), validate(createConsultationSchema), consultationController.recordConsultation);

/**
 * @openapi
 * /consultations/{id}:
 *   get:
 *     summary: Get consultation details
 *     tags: [Consultations]
 *     security: [{ bearerAuth: [] }]
 *     description: Retrieves the details of a specific consultation. Only accessible by the patient or doctor involved in the appointment.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: The UUID of the consultation record.
 *     responses:
 *       '200': { description: "Consultation details." }
 *       '403': { description: "Forbidden. Not authorized to view." }
 *       '404': { description: "Consultation not found." }
 */
router.get('/:id', authorize(['DOCTOR', 'PATIENT']), consultationController.getConsultationDetails);

export default router;