import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import expressFileUpload from "express-fileupload";

// Enhanced environment configuration with security validation
import envConfig from "./config/environment.js";
import { connectDB } from "./database/db.js";
import { errorMiddleware } from "./middlewares/errorMiddlewares.js";

// Enhanced security and validation middleware
import { setupSecurity } from "./middlewares/security.js";
import { setupValidationMiddleware } from "./middlewares/validation.js";

import authRouter from "./routes/authRouter.js";
import bookRouter from "./routes/bookRouter.js";
import userRouter from "./routes/userRouter.js";
import borrowRouter from "./routes/borrowRouter.js";
import paymentRouter from "./routes/paymentRouter.js";
import adminPaymentRouter from "./routes/adminPaymentRouter.js";
import adminFineRouter from "./routes/adminFineRouter.js";
// 🎯 Import the complete fine management system
import { createFineRouter } from "./utils/fineCalculator.js";

import { notifyUsers } from "./services/notifyUsers.js";
import { removeUnverifiedAccounts } from "./services/removeUnverifiedAccounts.js";
import { startPaymentCleanupJob } from "./jobs/paymentCleanup.js";

// Get configuration
const config = envConfig.getConfig();
const serverConfig = config.server;
const securityConfig = config.security;

// Initialize Express
export const app = express();

// ===== SECURITY MIDDLEWARE =====
// Apply comprehensive security middleware first
setupSecurity(app);

// ===== MIDDLEWARES =====
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressFileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit (increased for book covers)
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true,
  debug: config.isDevelopment
}));

// ===== VALIDATION MIDDLEWARE SETUP =====
setupValidationMiddleware(app);

// ===== ROUTES =====
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/book", bookRouter);
app.use("/api/v1/borrow", borrowRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/admin/payments", adminPaymentRouter);
app.use("/api/v1/admin/fines", adminFineRouter);
// 🎯 Use the new consolidated fine management system
console.log(" Registering fine management routes at /api/v1/fines");
const fineRouter = createFineRouter();
console.log(" Fine router created with routes:");
// Log all routes in the fine router
fineRouter.stack.forEach((route) => {
  if (route.route) {
    console.log(`   ${Object.keys(route.route.methods).join(', ').toUpperCase()} ${route.route.path}`);
  }
});
app.use("/api/v1/fines", fineRouter);

// ===== TEST ROUTE =====
app.get("/", (req, res) => {
  res.json({
    message: "🚀 LibraFlow Backend is Running Successfully!",
    environment: config.environment,
    version: "2.0.0",
    security: "Enhanced",
    timestamp: new Date().toISOString()
  });
});

// ===== API TEST ROUTE =====
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working correctly",
    timestamp: new Date().toISOString()
  });
});

// ===== DATABASE CONNECTION =====
connectDB()
  .then(() => console.log("✅ Database connected successfully"))
  .catch(err => {
    console.error("❌ DB Connection Failed:", err.message);
    process.exit(1);
  });

// ===== CRON JOBS =====
// Store service controls for potential management
let cleanupServiceControls = null;
let notificationServiceControls = null;
let paymentCleanupJob = null;

// Schedule cron jobs (they internally handle async)
setImmediate(() => {
  try {
    notificationServiceControls = notifyUsers(); // Enhanced notification service
    cleanupServiceControls = removeUnverifiedAccounts(); // Enhanced cleanup service
    paymentCleanupJob = startPaymentCleanupJob(); // Payment order cleanup job
    console.log("✅ Enhanced services initialized successfully");
    console.log("   • Smart notification service: Active with 3 scheduling strategies");
    console.log("   • Multi-tier cleanup service: Active with 3 strategies");
    console.log("   • Payment cleanup service: Active");
  } catch (err) {
    console.error("❌ Error initializing services:", err);
  }
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('🛡️ SIGTERM received, shutting down gracefully...');
  if (cleanupServiceControls) {
    cleanupServiceControls.stop();
  }
  if (notificationServiceControls) {
    notificationServiceControls.stop();
  }
  if (paymentCleanupJob) {
    paymentCleanupJob.stop();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛡️ SIGINT received, shutting down gracefully...');
  if (cleanupServiceControls) {
    cleanupServiceControls.stop();
  }
  if (notificationServiceControls) {
    notificationServiceControls.stop();
  }
  if (paymentCleanupJob) {
    paymentCleanupJob.stop();
  }
  process.exit(0);
});

// ===== ERROR HANDLER =====
app.use(errorMiddleware);

// ===== 404 HANDLER =====
app.use((req, res, next) => {
  console.log('404 Handler - Route not found:', {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    query: req.query,
    params: req.params
  });
  
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// ===== GLOBAL UNHANDLED REJECTION HANDLER =====
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  // Optionally: graceful shutdown
});