import express from 'express';
import { isAuthenticated } from '../middlewares/authMiddleware.js';
import { createFinePaymentOrder, verifyRazorpayPayment, getPaymentOrderStatus, getPaymentMetrics } from '../controllers/paymentController.js';

const router = express.Router();

// Create Razorpay order for fine payment
router.post('/create-order', 
  isAuthenticated,
  createFinePaymentOrder
);

// Verify Razorpay payment
router.post('/verify-payment',
  isAuthenticated,
  verifyRazorpayPayment
);

// Get payment order status
router.get('/order-status/:orderId',
  isAuthenticated,
  getPaymentOrderStatus
);

// Get payment metrics (Admin only)
router.get('/metrics',
  isAuthenticated,
  getPaymentMetrics
);

export default router;