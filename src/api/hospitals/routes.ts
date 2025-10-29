import { Router } from 'express';
import { authenticateToken, authorize } from '../../middleware/auth';
import { createHospital, deleteHospital, getAllHospitals, getHospitalById, updateHospital } from './controller';

const router = Router();

// All hospital routes are protected
router.use(authenticateToken);

/**
 * @swagger
 * /hospitals:
 *   post:
 *     summary: Register a new hospital (Admin only)
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  properties:
 *                      name: { type: string }
 *                      licenseNumber: { type: string }
 *                      address: { type: string }
 *                      contactEmail: { type: string, format: email }
 *                      contactPhone: { type: string }
 *                      adminId: { type: string, format: uuid, description: "ID of an existing User with HOSPITAL_ADMIN role" }
 *     responses:
 *       201: { description: "Hospital registered successfully" }
 *       403: { description: "Forbidden" }
 */
router.post('/', authorize(['ADMIN']), createHospital);

/**
 * @swagger
 * /hospitals:
 *   get:
 *     summary: Get a list of all hospitals
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: "List of hospitals" }
 */
router.get('/', getAllHospitals);

/**
 * @swagger
 * /hospitals/{id}:
 *   get:
 *     summary: Get details of a specific hospital
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: "Hospital details" }
 *       404: { description: "Hospital not found" }
 */
router.get('/:id', getHospitalById);

/**
 * @swagger
 * /hospitals/{id}:
 *   patch:
 *     summary: Update hospital information (Admin or assigned Hospital Admin)
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  properties:
 *                      name: { type: string }
 *                      address: { type: string }
 *     responses:
 *       200: { description: "Hospital updated successfully" }
 *       403: { description: "Forbidden" }
 */
router.patch('/:id', authorize(['ADMIN', 'HOSPITAL_ADMIN']), updateHospital);

/**
 * @swagger
 * /hospitals/{id}:
 *   delete:
 *     summary: Delete a hospital (Admin only)
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: "Hospital deleted successfully" }
 *       403: { description: "Forbidden" }
 */
router.delete('/:id', authorize(['ADMIN']), deleteHospital);

export default router;