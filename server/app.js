// server/app.js
import express from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import fileUpload from "express-fileupload";

import { connectDB } from "./database/db.js";
import { errorMiddleware } from "./middlewares/errorMiddlewares.js";

// Routers
import authRouter from "./routes/authRouter.js";
import bookRouter from "./routes/bookRouter.js";
import userRouter from "./routes/userRouter.js";
import borrowRouter from "./routes/borrowRouter.js";

// Services (cron jobs)
import { notifyUsers } from "./services/notifyUsers.js";
import { removeUnverifiedAccounts } from "./services/removeUnverifiedAccounts.js";

// ===== Load environment variables =====
config({ path: "./config/config.env" });

// ===== Initialize Express =====
export const app = express();

// ===== CORS CONFIG =====
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173", // local dev (Vite)
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow Postman / mobile apps
    if (allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS Error: Origin ${origin} not allowed`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// ===== MIDDLEWARES =====
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    abortOnLimit: true,
    safeFileNames: true,
    preserveExtension: true,
  })
);

// ===== ROUTES =====
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/book", bookRouter);
app.use("/api/v1/borrow", borrowRouter);
app.use("/api/v1/user", userRouter);

// ===== HEALTH CHECK =====
app.get("/", (req, res) => {
  res.status(200).send("🚀 LibraFlow Backend is Running Successfully!");
});

// ===== CONNECT DATABASE =====
connectDB()
  .then(() => console.log("✅ Database connected successfully"))
  .catch((err) => {
    console.error("❌ DB Connection Failed:", err.message);
    process.exit(1);
  });

// ===== CRON JOBS =====
setImmediate(() => {
  try {
    notifyUsers(); // schedules user notifications for overdue books
    removeUnverifiedAccounts(); // cleans up unverified accounts
    console.log("✅ Cron jobs scheduled successfully");
  } catch (err) {
    console.error("❌ Error scheduling cron jobs:", err.message);
  }
});

// ===== ERROR HANDLER (Always last) =====
app.use(errorMiddleware);