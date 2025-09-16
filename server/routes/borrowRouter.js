import express from 'express';
import {
  recordBorrowedBook,
  borrowedBooks,
  getBorrowedBooksForAdmin,
  returnBorrowBook
} from '../controllers/borrowControllers.js';
import { isAuthenticated, isAuthorized } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ===== ADMIN BORROW ROUTES =====
router.post('/record-borrow-book/:id', isAuthenticated, isAuthorized("Admin"), recordBorrowedBook); // Record borrowed book
router.get('/admin/borrowed-books', isAuthenticated, isAuthorized("Admin"), getBorrowedBooksForAdmin); // List all borrowed books for admin

// ===== USER BORROW ROUTES =====
router.get('/my-borrowed-books', isAuthenticated, borrowedBooks); // User’s borrowed books
router.put('/return-borrow-book/:bookId', isAuthenticated, returnBorrowBook); // Return a borrowed book

export default router;
