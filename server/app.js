import express from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import expressFileUpload from "express-fileupload";

import { connectDB } from "./database/db.js";
import { errorMiddleware } from "./middlewares/errorMiddlewares.js";

import authRouter from "./routes/authRouter.js";
import bookRouter from "./routes/bookRouter.js";
import userRouter from "./routes/userRouter.js";
import borrowRouter from "./routes/borrowRouter.js";
import paymentRouter from "./routes/paymentRouter.js";

import { notifyUsers } from "./services/notifyUsers.js";
import { removeUnverifiedAccounts } from "./services/removeUnverifiedAccounts.js";

// Load environment variables
config({ path: "./config/config.env" });

// Initialize Express
export const app = express();

// ===== AGGRESSIVE CORS FIX =====
console.log("🌐 Setting up CORS...");
console.log("🔗 Frontend URL from env:", process.env.FRONTEND_URL);

// Aggressive CORS configuration - Allow everything
app.use(cors({
  origin: "*", // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: "*", // Allow all headers
  credentials: false, // Disable credentials for wildcard origin
  optionsSuccessStatus: 200
}));

// ===== AGGRESSIVE CORS HEADERS =====
app.use((req, res, next) => {
  // Set aggressive CORS headers for immediate fix
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Max-Age', '86400');

  // Log CORS requests for debugging
  console.log(`🔄 CORS: ${req.method} ${req.path} from ${req.headers.origin || 'no-origin'}`);

  // Handle preflight OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    console.log(`✅ CORS: Preflight handled for ${req.path}`);
    return res.status(200).json({ message: 'CORS OK' });
  }

  next();
});

// ===== MIDDLEWARES =====
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressFileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true
}));

// ===== ROUTES =====
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/book", bookRouter);
app.use("/api/v1/borrow", borrowRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/payment", paymentRouter);

// ===== TEST ROUTES =====
app.get("/", (req, res) => {
  res.send("🚀 LibraFlow Backend is Running Successfully!");
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "LibraFlow Backend is healthy",
    timestamp: new Date().toISOString(),
    cors: "enabled"
  });
});

// ===== CORS TEST ROUTE =====
app.get("/cors-test", (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.json({
    success: true,
    message: "CORS is working correctly!",
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'no-origin'
  });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
  // Set CORS headers for 404 responses too
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');

  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
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
// Schedule cron jobs (they internally handle async)
setImmediate(() => {
  try {
    notifyUsers(); // schedules the notifyUsers cron
    removeUnverifiedAccounts(); // schedules the removeUnverifiedAccounts cron
    console.log("✅ Cron jobs scheduled successfully");
  } catch (err) {
    console.error("❌ Error scheduling cron jobs:", err);
  }
});

// ===== BASIC ERROR HANDLING =====

// ===== ERROR HANDLER =====
app.use(errorMiddleware);

// ===== GLOBAL UNHANDLED REJECTION HANDLER =====
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  // Optionally: graceful shutdown
});