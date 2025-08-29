// server/controllers/borrowControllers.js
import mongoose from "mongoose";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { Borrow } from "../models/borrowModels.js";
import { Book } from "../models/bookModels.js";
import { User } from "../models/userModels.js";
import fineCalculator from "../utils/fineCalculator.js";

/**
 * Record borrowing a book (Admin only)
 */
export const recordBorrowedBook = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params; // Book ID
  const { email } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Book ID.", 400));
  }

  const book = await Book.findById(id);
  if (!book) return next(new ErrorHandler("Book not found.", 404));

  const user = await User.findOne({ email: email.toLowerCase(), accountVerified: true });
  if (!user) return next(new ErrorHandler("User not found.", 404));

  if (book.quantity <= 0) return next(new ErrorHandler("Book not available.", 400));

  // Check if user has already borrowed this book and not returned
  const latestBorrow = await Borrow.findOne({ book: id, user: user._id }).sort({ borrowDate: -1 });
  if (latestBorrow && !latestBorrow.returnDate) {
    return next(new ErrorHandler("You have already borrowed this book.", 400));
  }

  // Reduce book quantity and update availability
  book.quantity -= 1;
  book.available = book.quantity > 0;
  await book.save();

  // Set due date (7 days from now)
  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Create borrow record
  const borrowRecord = await Borrow.create({
    user: user._id,
    name: user.name,
    email: user.email,
    book: book._id,
    dueDate,
    price: book.price,
  });

  // Update user's BorrowBooks array
  if (!Array.isArray(user.BorrowBooks)) user.BorrowBooks = [];
  user.BorrowBooks.push({
    bookId: borrowRecord._id,
    returned: false,
    bookTitle: book.title || "Untitled",
    BorrowedDate: borrowRecord.borrowDate,
    DueDate: borrowRecord.dueDate,
  });
  await user.save();

  res.status(200).json({
    success: true,
    message: "Book borrowed successfully.",
    borrow: borrowRecord,
  });
});

/**
 * Return a borrowed book
 */
export const returnBorrowBook = catchAsyncErrors(async (req, res, next) => {
  const { bookId } = req.params;
  const { email } = req.body;

  const book = await Book.findById(bookId);
  if (!book) return next(new ErrorHandler("Book not found.", 404));

  const user = await User.findOne({ email: email.toLowerCase(), accountVerified: true });
  if (!user) return next(new ErrorHandler("User not found.", 404));

  const borrowedBook = await Borrow.findOne({ book: bookId, user: user._id }).sort({ borrowDate: -1 });
  if (!borrowedBook) return next(new ErrorHandler("You have not borrowed this book.", 400));
  if (borrowedBook.returnDate) return next(new ErrorHandler("You have already returned this book.", 400));

  // Update book quantity and availability
  book.quantity += 1;
  book.available = true;
  await book.save();

  // Calculate fine if any
  borrowedBook.returnDate = new Date();
  const { fine, message: fineMessage } = fineCalculator(borrowedBook.dueDate, borrowedBook.returnDate);
  borrowedBook.fine = fine;
  await borrowedBook.save();

  // Update user's BorrowBooks array
  if (Array.isArray(user.BorrowBooks)) {
    user.BorrowBooks = user.BorrowBooks.map(entry => {
      if (entry.bookId.toString() === borrowedBook._id.toString()) entry.returned = true;
      return entry;
    });
  }
  await user.save();

  res.status(200).json({
    success: true,
    message:
      fine > 0
        ? `The book has been returned successfully. Total charges including fine: ₹${fine + book.price}`
        : `The book has been returned successfully. Total charges: ₹${book.price}`,
    fineDetails: {
      fine,
      note: fineMessage,
      totalCharge: fine + book.price,
    },
  });
});

/**
 * Get all borrowed books for a specific user by email
 */
export const borrowedBooks = catchAsyncErrors(async (req, res, next) => {
  const email = req.query.email;
  if (!email) return next(new ErrorHandler("Email is required.", 400));

  const user = await User.findOne({ email: email.toLowerCase(), accountVerified: true });
  if (!user) return next(new ErrorHandler("User not found.", 404));

  const borrows = await Borrow.find({ user: user._id })
    .populate("book")
    .sort({ borrowDate: -1 });

  res.status(200).json({ success: true, borrowedBooks: borrows });
});

/**
 * Get all borrowed books (Admin view)
 */
export const getBorrowedBooksForAdmin = catchAsyncErrors(async (req, res, next) => {
  const borrowedBooks = await Borrow.find()
    .populate("book user") // Populate book and user details
    .sort({ borrowDate: -1 });

  res.status(200).json({ success: true, borrowedBooks });
});
