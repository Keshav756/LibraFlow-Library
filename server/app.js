import express from 'express';
import { config } from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { connectDB } from './database/db.js';
import { errorMiddleware } from './middlewares/errorMiddlewares.js';
import authRouter from './routes/authRouter.js';
import bookRouter from './routes/bookRouter.js';
import userRouter from './routes/userRouter.js';
import borrowRouter from './routes/borrowRouter.js';
import expressFileUpload from 'express-fileupload';
import { notifyUsers } from './services/notifyUsers.js';
import { removeUnverifiedAccounts } from './services/removeUnverifiedAccounts.js';

export const app = express();

// Load environment variables
config({ path: './config/config.env' });

// ===== CORS CONFIG =====
app.use(cors({
    origin: process.env.FRONTEND_URL, // Netlify frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true // allow cookies
}));

// Handle preflight requests for all routes
app.options("*", cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

// ===== MIDDLEWARES =====
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressFileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
}));

// ===== ROUTES =====
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/book", bookRouter);
app.use("/api/v1/borrow", borrowRouter);
app.use("/api/v1/user", userRouter);

// ===== DATABASE CONNECTION =====
connectDB().then(() => {
    console.log("🚀 Server connected to DB and ready to handle requests");
}).catch((err) => {
    console.error("❌ Failed to connect DB:", err);
    process.exit(1);
});

// ===== CRON JOBS =====
notifyUsers(); // notify overdue book borrowers
removeUnverifiedAccounts(); // remove unverified accounts

// ===== ERROR HANDLING =====
app.use(errorMiddleware);
