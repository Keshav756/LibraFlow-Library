import express from 'express';
import { config } from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import expressFileUpload from 'express-fileupload';

import { connectDB } from './database/db.js';
import { errorMiddleware } from './middlewares/errorMiddlewares.js';

import authRouter from './routes/authRouter.js';
import bookRouter from './routes/bookRouter.js';
import userRouter from './routes/userRouter.js';
import borrowRouter from './routes/borrowRouter.js';

import { notifyUsers } from './services/notifyUsers.js';
import { removeUnverifiedAccounts } from './services/removeUnverifiedAccounts.js';

export const app = express();

// Load env variables
config({ path: './config/config.env' });

// ===== CORS =====
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Preflight
app.options('*', cors({
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
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/book', bookRouter);
app.use('/api/v1/borrow', borrowRouter);
app.use('/api/v1/user', userRouter);

// ===== DATABASE =====
connectDB()
    .then(() => console.log('✅ Connected to Database'))
    .catch((err) => {
        console.error('❌ DB Connection Failed:', err.message);
        process.exit(1);
    });

// ===== CRON JOBS =====
notifyUsers();
removeUnverifiedAccounts();

// ===== ERROR HANDLER =====
app.use(errorMiddleware);
