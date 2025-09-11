import express from 'express';
import { isAuthenticated, isAuthorized } from '../middlewares/authMiddleware.js';
import { 
  reconcileBorrow, 
  reconcileAll, 
  getPaymentStats 
} from '../controllers/adminPaymentController.js';

const router = express.Router();

// Reconcile payments for a specific borrow record
router.post('/reconcile-borrow/:borrowId', 
  isAuthenticated,
  isAuthorized('Admin'),
  reconcileBorrow
);

// Reconcile all recent payments
router.post('/reconcile-all',
  isAuthenticated,
  isAuthorized('Admin'),
  reconcileAll
);

// Get payment statistics
router.get('/stats',
  isAuthenticated,
  isAuthorized('Admin'),
  getPaymentStats
);

export default router;