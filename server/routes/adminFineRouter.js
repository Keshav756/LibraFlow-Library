import express from 'express';
import { isAuthenticated, isAuthorized } from '../middlewares/authMiddleware.js';
import { 
  getBorrowAuditTrail, 
  getUserAuditTrail, 
  adjustBorrowFine 
} from '../controllers/adminFineController.js';
import { validateObjectId } from '../middlewares/validation.js';

const router = express.Router();

// Get audit trail for a specific borrow record
router.get('/audit-trail/:borrowId',
  isAuthenticated,
  isAuthorized('Admin'),
  validateObjectId('borrowId'),
  getBorrowAuditTrail
);

// Get audit trail for a specific user
router.get('/user-audit-trail/:userId',
  isAuthenticated,
  isAuthorized('Admin'),
  validateObjectId('userId'),
  getUserAuditTrail
);

// Manually adjust fine for a borrow record
router.post('/adjust-fine/:borrowId',
  isAuthenticated,
  isAuthorized('Admin'),
  validateObjectId('borrowId'),
  adjustBorrowFine
);

export default router;