import { Router } from 'express';
import { ReceptionistController } from './controller';
import { authenticateToken, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { addReceptionistSchema, invitePatientSchema } from './validation';

const router = Router();
const receptionistController = new ReceptionistController();

/**
 * @openapi
 * tags:
 *   name: Receptionists
 *   description: Operations for managing receptionists and their actions, like inviting and approving patients.
 */

router.use(authenticateToken);

/**
 * @openapi
 * /receptionists:
 *   post:
 *     summary: Add a new receptionist to a hospital
 *     tags: [Receptionists]
 *     security: [{ bearerAuth: [] }]
 *     description: Allows a Hospital Admin to register an existing user (with the 'RECEPTIONIST' role) as a receptionist for their hospital.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, hospitalId]
 *             properties:
 *               userId: { type: string, format: uuid, description: "The UUID of the user with the RECEPTIONIST role." }
 *               hospitalId: { type: string, format: uuid, description: "The UUID of the hospital to which the receptionist will be added." }
 *     responses:
 *       '201': { description: "Receptionist added successfully." }
 *       '403': { description: "Forbidden. User is not a Hospital Admin." }
 *       '409': { description: "Conflict. This user is already a receptionist." }
 */
router.post('/', authorize(['HOSPITAL_ADMIN']), validate(addReceptionistSchema), receptionistController.addReceptionist);

/**
 * @openapi
 * /receptionists:
 *   get:
 *     summary: List all receptionists for a hospital
 *     tags: [Receptionists]
 *     security: [{ bearerAuth: [] }]
 *     description: Allows a Hospital Admin to view all receptionists working at a specific hospital.
 *     parameters:
 *       - in: query
 *         name: hospitalId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: The UUID of the hospital to retrieve receptionists for.
 *     responses:
 *       '200': { description: "A list of receptionists for the hospital." }
 *       '403': { description: "Forbidden. User is not a Hospital Admin." }
 */
router.get('/', authorize(['HOSPITAL_ADMIN']), receptionistController.listReceptionists);

/**
 * @openapi
 * /receptionists/patients/invite:
 *   post:
 *     summary: Invite a new patient to the platform
 *     tags: [Receptionists]
 *     security: [{ bearerAuth: [] }]
 *     description: Allows a Receptionist to send an email invitation to a new patient, which contains a registration link.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, fullName, phone]
 *             properties:
 *               email: { type: string, format: email, example: "new.patient@example.com" }
 *               fullName: { type: string, example: "Jane Doe" }
 *               phone: { type: string, example: "0788123456" }
 *     responses:
 *       '200': { description: "Patient invitation sent successfully." }
 *       '403': { description: "Forbidden. User is not a Receptionist." }
 *       '409': { description: "A user with this email already exists." }
 */
router.post('/patients/invite', authorize(['RECEPTIONIST']), validate(invitePatientSchema), receptionistController.invitePatient);

// /**
//  * @openapi
//  * /receptionists/patients/approve/{id}:
//  *   patch:
//  *     summary: Approve a pending patient account
//  *     tags: [Receptionists]
//  *     security: [{ bearerAuth: [] }]
//  *     description: Allows a Receptionist to change a patient's account status from 'PENDING' to 'ACTIVE'.
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema: { type: string, format: uuid }
//  *         description: The UUID of the User account to approve.
//  *     responses:
//  *       '200': { description: "Patient approved successfully." }
//  *       '403': { description: "Forbidden. User is not a Receptionist." }
//  *       '404': { description: "No pending patient found with this ID." }
//  */
// router.patch('/patients/approve/:id', authorize(['RECEPTIONIST']), receptionistController.approvePatient);

export default router;