// server/routes/bookRoutes.js
import express from "express";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import {
  addBook,
  deleteBook,
  getAllBooks,
  updateBook,
} from "../controllers/bookControllers.js";

const router = express.Router();

// ------- ADMIN (protected) -------
router.post("/admin/add", isAuthenticated, isAuthorized("Admin"), addBook);
router.put("/admin/update/:id", isAuthenticated, isAuthorized("Admin"), updateBook);
router.delete("/admin/delete/:id", isAuthenticated, isAuthorized("Admin"), deleteBook);

// ------- PUBLIC (no auth) -------
router.get("/all", isAuthenticated, getAllBooks);

export default router;
