import express from "express";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import { addBook, deleteBook, getAllBooks, updateBook } from "../controllers/bookControllers.js";

const router = express.Router();

// Admin-only routes
router.post("/admin/add", isAuthenticated, isAuthorized("Admin"), addBook);
router.put("/admin/update/:id", isAuthenticated, isAuthorized("Admin"), updateBook);
router.delete("/admin/delete/:id", isAuthenticated, isAuthorized("Admin"), deleteBook);

// Public route (all authenticated users)
router.get("/all", isAuthenticated, getAllBooks);

export default router;
