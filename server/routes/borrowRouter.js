import express from "express";
import { borrowedBooks, getBorrowedBooksForAdmin, recordBorrowedBook, returnBorrowBook } from "../controllers/borrowControllers.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Admin records borrowed books
router.post("/record-borrow-book/:id", isAuthenticated, isAuthorized("Admin"), recordBorrowedBook);
<<<<<<< HEAD
router.get("/my-borrowed-books", isAuthenticated, borrowedBooks);
router.get("/admin/borrowed-books", isAuthenticated, isAuthorized("Admin"), getBorrowedBooksForAdmin);
=======

// User views borrowed books
router.get("/my-borrowed-books", isAuthenticated, borrowedBooks);

// Admin views all borrowed books
router.get("/admin/borrowed-books", isAuthenticated, isAuthorized("Admin"), getBorrowedBooksForAdmin);

// Return borrowed book
>>>>>>> 1730d72 (final commit)
router.put("/return-borrow-book/:bookId", isAuthenticated, returnBorrowBook);

export default router;
