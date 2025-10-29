import "dotenv/config";

const requiredEnvVars = [
  "PORT",
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "PAYPACK_CLIENT_ID",
  "PAYPACK_CLIENT_SECRET",
  "PAYPACK_WEBHOOK_SECRET",
  "FRONTEND_URL",
];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(
      `FATAL ERROR: Environment variable "${varName}" is not defined.`
    );
    process.exit(1);
  }
}

// --- Module Imports ---
import express, { Express, Request, Response } from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import { setupSwagger } from "./config/swagger";
import { errorHandler } from "./middleware/error";
import { socketService } from "./config/socket";

// --- Route Imports ---
import authRoutes from "./api/auth/routes";
// import userRoutes from "./api/users/routes";
import hospitalRoutes from "./api/hospitals/routes";
import doctorRoutes from "./api/doctors/routes";
import receptionistRoutes from "./api/receptionists/routes";
import patientRoutes from "./api/patients/routes";
import appointmentRoutes from "./api/appointments/routes";
import consultationRoutes from "./api/consultations/routes";
import paymentRoutes from "./api/payments/routes";
import notificationRoutes from "./api/notifications/routes";
import reportRoutes from "./api/reports/routes";
import roomsRoutes from "./api/rooms/routes";

// --- Application Initialization ---
const app: Express = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT;

// --- Initialize WebSocket Server ---
socketService.initialize(httpServer);

// --- Core Middleware ---
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(helmet());

// Special JSON parser for webhook rawBody
app.use(
  express.json({
    verify: (req: any, res, buf) => {
      if (req.originalUrl.startsWith("/payments/webhook/paypack")) {
        req.rawBody = buf;
      }
    },
  })
  
);
app.use(express.urlencoded({ extended: true }));

// --- API Documentation Setup ---
setupSwagger(app);

// --- API Routes Setup ---
app.use("/auth", authRoutes);
// app.use("/users", userRoutes);
app.use("/hospitals", hospitalRoutes);
app.use("/doctors", doctorRoutes);
app.use("/receptionists", receptionistRoutes);
app.use("/patients", patientRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/consultations", consultationRoutes);
app.use("/payments", paymentRoutes);
app.use("/notifications", notificationRoutes);
app.use("/reports", reportRoutes);
app.use("/rooms", roomsRoutes);

// --- Health Check Endpoint ---
app.get("/", (req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: "ok", message: "Telemedicine API is healthy" });
});

// --- Global Error Handling Middleware ---
app.use(errorHandler);

// --- Server Startup ---
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📚 API Docs available at http://localhost:${PORT}/api-docs`);
});

export default app;
