import { Router } from 'express';
import { DoctorController } from './controller';
import { authenticateToken, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { addDoctorSchema, updateDoctorSchema } from './validation';

const router = Router();
const doctorController = new DoctorController();

/**
 * @openapi
 * tags:
 *   name: Doctors
 *   description: Operations for managing doctors within the system.
 */

router.use(authenticateToken);

/**
 * @openapi
 * /doctors:
 *   post:
 *     summary: Add a new doctor to a hospital
 *     tags: [Doctors]
 *     security: [{ bearerAuth: [] }]
 *     description: Allows a Hospital Admin to register an existing user (with the 'DOCTOR' role) as a doctor for their hospital.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, hospitalId, specialization, licenseNumber, consultationFee]
 *             properties:
 *               userId: { type: string, format: uuid, description: "The UUID of the user with the DOCTOR role." }
 *               hospitalId: { type: string, format: uuid, description: "The UUID of the hospital to which the doctor will be added." }
 *               specialization: { type: string, example: "Cardiology" }
 *               licenseNumber: { type: string, example: "MD-12345" }
 *               availability: { type: string, example: "Mon-Fri, 9am-5pm" }
 *               consultationFee: { type: number, format: float, example: 50.00 }
 *     responses:
 *       '201': { description: "Doctor added successfully." }
 *       '400': { description: "Invalid input or the specified user is not a doctor." }
 *       '403': { description: "Forbidden. User is not a Hospital Admin for the specified hospital." }
 *       '409': { description: "Conflict. This user is already a doctor or the license number is in use." }
 */
router.post('/', authorize(['HOSPITAL_ADMIN']), validate(addDoctorSchema), doctorController.addDoctor);

/**
 * @openapi
 * /doctors:
 *   get:
 *     summary: List all doctors
 *     tags: [Doctors]
 *     security: [{ bearerAuth: [] }]
 *     description: Retrieves a list of all doctors. Can be filtered by hospital or specialization.
 *     parameters:
 *       - in: query
 *         name: hospitalId
 *         schema: { type: string, format: uuid }
 *         description: Optional. Filter doctors by a specific hospital UUID.
 *       - in: query
 *         name: specialization
 *         schema: { type: string }
 *         description: Optional. Filter doctors by their specialization (case-insensitive search).
 *     responses:
 *       '200': { description: "A list of doctors." }
 */
router.get('/', doctorController.listDoctors);

/**
 * @openapi
 * /doctors/{id}:
 *   patch:
 *     summary: Update a doctor's information
 *     tags: [Doctors]
 *     security: [{ bearerAuth: [] }]
 *     description: Allows a doctor to update their own profile, or a Hospital Admin to update a doctor in their hospital.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: The UUID of the doctor profile to update.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               specialization: { type: string, example: "General Medicine" }
 *               availability: { type: string, example: "Mon, Wed, Fri, 10am-4pm" }
 *               consultationFee: { type: number, format: float, example: 75.50 }
 *               status: { type: string, enum: [AVAILABLE, BUSY, OFFLINE], example: "AVAILABLE" }
 *     responses:
 *       '200': { description: "Doctor profile updated successfully." }
 *       '403': { description: "Forbidden. User is not authorized to update this profile." }
 *       '404': { description: "Doctor profile not found." }
 */
router.patch('/:id', authorize(['HOSPITAL_ADMIN', 'DOCTOR']), validate(updateDoctorSchema), doctorController.updateDoctor);

/**
 * @openapi
 * /doctors/{id}:
 *   delete:
 *     summary: Remove a doctor from a hospital
 *     tags: [Doctors]
 *     security: [{ bearerAuth: [] }]
 *     description: Allows a Hospital Admin to remove a doctor from their hospital. This does not delete the user account.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: The UUID of the doctor profile to remove.
 *     responses:
 *       '204': { description: "Doctor removed successfully." }
 *       '403': { description: "Forbidden. User is not a Hospital Admin for this doctor's hospital." }
 *       '404': { description: "Doctor profile not found." }
 */
router.delete('/:id', authorize(['HOSPITAL_ADMIN']), doctorController.removeDoctor);

export default router;