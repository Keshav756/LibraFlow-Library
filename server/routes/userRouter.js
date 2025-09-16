import express from 'express';
import { getAllUsers, registerNewAdmin } from '../controllers/userControllers.js';
import { isAuthenticated, isAuthorized } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ===== ADMIN USER ROUTES =====
router.get('/all', isAuthenticated, isAuthorized("Admin"), getAllUsers);       // Get all users
router.post('/add/new-admin', isAuthenticated, isAuthorized("Admin"), registerNewAdmin); // Add a new admin

export default router;
