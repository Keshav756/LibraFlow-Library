<<<<<<< HEAD
import express from "express";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import { addBook, deleteBook, getAllBooks, updateBook } from "../controllers/bookControllers.js";

const router = express.Router();

// Admin-only routes
=======
import express from 'express';
import { isAuthenticated, isAuthorized } from '../middlewares/authMiddleware.js';
import { addBook, deleteBook, getAllBooks, updateBook } from '../controllers/bookControllers.js';

const router = express.Router();

// ADMIN routes
>>>>>>> 1730d72 (final commit)
router.post("/admin/add", isAuthenticated, isAuthorized("Admin"), addBook);
router.put("/admin/update/:id", isAuthenticated, isAuthorized("Admin"), updateBook);
router.delete("/admin/delete/:id", isAuthenticated, isAuthorized("Admin"), deleteBook);

// Public route
router.get("/all", isAuthenticated, getAllBooks);

export default router;
