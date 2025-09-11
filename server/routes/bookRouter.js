import express from 'express';
import { 
  addBook, 
  updateBook, 
  deleteBook, 
  getAllBooks,
  getBookById,
  updateBookAvailability,
  getBookStatistics
} from '../controllers/bookControllers.js';
import { isAuthenticated, isAuthorized } from '../middlewares/authMiddleware.js';
import { 
  validateBookInput,
  validateBookUpdate,
  validateAvailabilityUpdate,
  validateObjectId
} from '../middlewares/validation.js';

const router = express.Router();

// ===== ADMIN BOOK ROUTES =====
// Create new book with validation and optional image upload
router.post('/admin/add', 
  isAuthenticated, 
  isAuthorized("Admin"), 
  validateBookInput,
  addBook
);

// Update book with validation
router.put('/admin/update/:id', 
  isAuthenticated, 
  isAuthorized("Admin"),
  validateObjectId('id'),
  validateBookUpdate,
  updateBook
);

// Delete book
router.delete('/admin/delete/:id', 
  isAuthenticated, 
  isAuthorized("Admin"),
  validateObjectId('id'),
  deleteBook
);

// Update book availability (for borrowing system)
router.patch('/admin/availability/:id',
  isAuthenticated,
  isAuthorized("Admin"),
  validateObjectId('id'),
  validateAvailabilityUpdate,
  updateBookAvailability
);

// Get comprehensive book statistics (Admin only)
router.get('/admin/statistics',
  isAuthenticated,
  isAuthorized("Admin"),
  getBookStatistics
);

// ===== PUBLIC BOOK ROUTES =====
// List all books with search, filtering, and pagination
router.get('/all', isAuthenticated, getAllBooks);

// Get single book by ID
router.get('/:id', 
  isAuthenticated,
  validateObjectId('id'),
  getBookById
);

// Update book availability (for regular users - borrowing/returning)
router.patch('/availability/:id',
  isAuthenticated,
  validateObjectId('id'),
  validateAvailabilityUpdate,
  updateBookAvailability
);

export default router;
