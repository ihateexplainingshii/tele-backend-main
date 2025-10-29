import { Router } from 'express';
import { ReportController } from './controller';
import { authenticateToken, authorize } from '../../middleware/auth';

const router = Router();
const reportController = new ReportController();

/**
 * @openapi
 * tags:
 *   name: Reports
 *   description: Endpoints for generating analytics and summary reports.
 */

router.use(authenticateToken);

/**
 * @openapi
 * /reports/hospital/{id}:
 *   get:
 *     summary: Get a report for a specific hospital
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     description: Retrieves key performance indicators for a single hospital, such as total appointments and earnings. Accessible by Admins and the hospital's own admin.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: The UUID of the hospital.
 *     responses:
 *       '200': { description: "Hospital performance report." }
 *       '403': { description: "Forbidden." }
 */
router.get('/hospital/:id', authorize(['ADMIN', 'HOSPITAL_ADMIN']), reportController.getHospitalReport);

/**
 * @openapi
 * /reports/system:
 *   get:
 *     summary: Get a system-wide report
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     description: Retrieves platform-wide analytics. Accessible by Admins only.
 *     responses:
 *       '200': { description: "System-wide analytics report." }
 *       '403': { description: "Forbidden." }
 */
router.get('/system', authorize(['ADMIN']), reportController.getSystemReport);

export default router;