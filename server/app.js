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

// ===== CORS CONFIG =====
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://libraflow-library-management-system.netlify.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

const corsOptions = {
  origin: (origin, callback) => {
    console.log(`🔍 CORS Request from origin: ${origin}`);
    if (!origin) return callback(null, true); // allow Postman or mobile apps
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS: Origin ${origin} allowed`);
      callback(null, true);
    } else {
      console.log(`❌ CORS: Origin ${origin} not allowed. Allowed origins:`, allowedOrigins);
      callback(new Error(`CORS Error: Origin ${origin} not allowed`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

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

// ===== TEST ROUTE =====
app.get("/", (req, res) => {
  res.send("🚀 LibraFlow Backend is Running Successfully!");
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

// ===== ERROR HANDLER =====
app.use(errorMiddleware);

// ===== GLOBAL UNHANDLED REJECTION HANDLER =====
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  // Optionally: graceful shutdown
});