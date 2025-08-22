import express from "express";
import {
  borrowedBooks,
  getBorrowedBooksForAdmin,
  recordBorrowedBook,
  returnBorrowBook,
} from "../controllers/borrowControllers.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/record-borrow-book/:id", isAuthenticated, isAuthorized("Admin"), recordBorrowedBook);

router.get("/my-borrowed-books", isAuthenticated, borrowedBooks);

router.get("/admin/borrowed-books", isAuthenticated, isAuthorized("Admin"), getBorrowedBooksForAdmin);

router.put("/return-borrow-book/:bookId", isAuthenticated, returnBorrowBook);

export default router;