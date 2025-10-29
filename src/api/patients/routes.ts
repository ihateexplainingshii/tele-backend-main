import { Router } from 'express';
import { PatientController } from './controller';
import { authenticateToken, authorize } from '../../middleware/auth';

const router = Router();
const patientController = new PatientController();

/**
 * @openapi
 * tags:
 *   name: Patients
 *   description: Operations for viewing and managing patient profiles.
 */

router.use(authenticateToken);

/**
 * @openapi
 * /patients/{id}:
 *   get:
 *     summary: Get a patient's profile
 *     tags: [Patients]
 *     security: [{ bearerAuth: [] }]
 *     description: |
 *       Retrieves the detailed profile of a specific patient.
 *       - A Patient can only view their own profile.
 *       - A Receptionist or Doctor can view profiles of patients within their hospital.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: The UUID of the patient profile to retrieve.
 *     responses:
 *       '200': { description: "Patient profile data." }
 *       '403': { description: "Forbidden. You are not authorized to view this profile." }
 *       '404': { description: "Patient profile not found." }
 */
router.get('/:id', authorize(['PATIENT', 'RECEPTIONIST', 'DOCTOR']), patientController.getProfile);

/**
 * @openapi
 * /patients/{id}:
 *   patch:
 *     summary: Update a patient's profile
 *     tags: [Patients]
 *     security: [{ bearerAuth: [] }]
 *     description: |
 *       Updates a patient's non-critical information.
 *       - A Patient can update their own profile.
 *       - A Receptionist can update a patient's profile.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: The UUID of the patient profile to update.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dateOfBirth: { type: string, format: date, example: "1990-01-15" }
 *               gender: { type: string, enum: [MALE, FEMALE, OTHER] }
 *               bloodType: { type: string, example: "O+" }
 *               medicalHistory: { type: object, description: "A JSON object for storing medical history.", example: { allergies: ["penicillin"], conditions: ["hypertension"] } }
 *               insuranceProvider: { type: string, example: "Radiant" }
 *               insuranceNumber: { type: string, example: "RAD-98765" }
 *     responses:
 *       '200': { description: "Patient profile updated successfully." }
 *       '403': { description: "Forbidden. You are not authorized to update this profile." }
 *       '404': { description: "Patient profile not found." }
 */
router.patch('/:id', authorize(['PATIENT', 'RECEPTIONIST']), patientController.updateProfile);

export default router;