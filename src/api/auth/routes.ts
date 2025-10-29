import { Router } from 'express';
import { AuthController } from './controller';
import { authenticateToken } from '../../middleware/auth';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate';
import { signupSchema, loginSchema } from './validation'; // We'll re-use these

const router = Router();
const authController = new AuthController();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
});

// /**
//  * @openapi
//  * /auth/register:
//  *   post:
//  *     summary: Register a new patient account
//  *     tags: [Auth]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [fullName, email, password, phone]
//  *             properties:
//  *               fullName: { type: string }
//  *               email: { type: string, format: email }
//  *               password: { type: string, format: password }
//  *               phone: { type: string }
//  *     responses:
//  *       201: { description: "Verification email sent" }
//  *       409: { description: "User already exists" }
//  */
// router.post('/register', authLimiter, validate(signupSchema), authController.registerPatient);

// /**
//  * @openapi
//  * /auth/verify:
//  *   get:
//  *     summary: Verify email address via token
//  *     tags: [Auth]
//  *     parameters:
//  *       - in: query
//  *         name: token
//  *         required: true
//  *         schema: { type: string }
//  *     responses:
//  *       200: { description: "HTML success page" }
//  *       400: { description: "Invalid or expired token" }
//  */
// router.get('/verify', authController.verifyEmail);

// New endpoint for completing an invitation for any role
/**
 * @openapi
 * /auth/complete-invitation:
 *   post:
 *     summary: Complete an account setup from an invitation link
 *     tags: [Auth]
 *     description: The final step for an invited user. They provide their details and the invitation token to create their account. The required fields depend on the role specified in the token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, fullName, phone, password]
 *             properties:
 *               token: { type: string, description: "The JWT received in the invitation email link." }
 *               fullName: { type: string }
 *               phone: { type: string }
 *               password: { type: string, format: password }
 *               specialization: { type: string, description: "Required if role is DOCTOR.", example: "Pediatrics" }
 *               licenseNumber: { type: string, description: "Required if role is DOCTOR.", example: "MD-12345" }
 *               consultationFee: { type: number, description: "Required if role is DOCTOR.", example: 20000 }
 *               dateOfBirth: { type: string, format: "date", description: "Required if role is PATIENT.", example: "1995-07-20" }
 *               gender: { type: string, enum: [MALE, FEMALE], description: "Required if role is PATIENT." }
 *     responses:
 *       '201': { description: "Account created successfully." }
 *       '400': { description: "Invalid/expired token or missing required fields for the role." }
 *       '409': { description: "Email is already registered." }
 */
router.post('/complete-invitation', authController.completeInvitation);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       200: { description: "Login successful" }
 *       401: { description: "Invalid credentials" }
 *       403: { description: "Email not verified or account inactive" }
 */
router.post('/login', authLimiter, validate(loginSchema), authController.login);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "User profile" }
 *       401: { description: "Unauthorized" }
 */
router.get('/me', authenticateToken, authController.me);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log out the user
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Logged out successfully" }
 */
router.post('/logout', authenticateToken, authController.logout);

export default router;