import express from 'express';
import {
  register,
  verifyOTP,
  login,
  logout,
  getUser,
  forgotPassword,
  resetPassword,
  updatePassword
} from '../controllers/authControllers.js';
import { isAuthenticated } from '../middlewares/authMiddleware.js';
// Import validation middleware
import { validate } from '../middlewares/validation.js';
import { ValidationSchemas } from '../middlewares/validation.js';

const router = express.Router();

// ===== AUTH ROUTES =====
router.post('/register', validate(ValidationSchemas.userRegistration), register);              // User registration
router.post('/verify-otp', validate(ValidationSchemas.otpVerification), verifyOTP);          // OTP verification after registration
router.post('/login', validate(ValidationSchemas.userLogin), login);                    // Login
router.get('/logout', isAuthenticated, logout); // Logout
router.get('/me', isAuthenticated, getUser);   // Get current user info

// ===== PASSWORD MANAGEMENT =====
router.post('/password/forgot', forgotPassword);             // Forgot password
router.put('/password/reset/:token', validate(ValidationSchemas.passwordReset), resetPassword);         // Reset password via token
router.put('/password/update', isAuthenticated, updatePassword); // Update password while logged in

export default router;