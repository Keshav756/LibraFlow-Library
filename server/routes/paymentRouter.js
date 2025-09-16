import express from 'express';
import { 
  createOrder, 
  verifyPayment, 
  getUserPayments, 
  getAllPayments 
} from '../controllers/paymentController.js';
import { isAuthenticated, isAuthorized } from '../middlewares/authMiddleware.js';

const router = express.Router();

// User routes
router.post('/create-order', isAuthenticated, createOrder);
router.post('/verify-payment', isAuthenticated, verifyPayment);
router.get('/my-payments', isAuthenticated, getUserPayments);

// Admin routes
router.get('/all-payments', isAuthenticated, isAuthorized("Admin"), getAllPayments);

export default router;