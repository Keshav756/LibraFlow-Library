import express from 'express';
import { addBook, updateBook, deleteBook, getAllBooks } from '../controllers/bookControllers.js';
import { isAuthenticated, isAuthorized } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ===== ADMIN BOOK ROUTES =====
router.post('/admin/add', isAuthenticated, isAuthorized("Admin"), addBook);        // Add a book
router.put('/admin/update/:id', isAuthenticated, isAuthorized("Admin"), updateBook); // Update a book
router.delete('/admin/delete/:id', isAuthenticated, isAuthorized("Admin"), deleteBook); // Delete a book

// ===== PUBLIC BOOK ROUTES =====
router.get('/all', getAllBooks); // List all books (public access)

export default router;
