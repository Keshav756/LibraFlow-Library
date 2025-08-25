import mongoose from "mongoose";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { Borrow } from "../models/borrowModels.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { Book } from "../models/bookModels.js";
import { User } from "../models/userModels.js";
import fineCalculator from "../utils/fineCalculator.js";

// Borrow a book
export const recordBorrowedBook = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { email } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Book ID", 400));
  }

  const book = await Book.findById(id);
  if (!book) return next(new ErrorHandler("Book not found", 404));

  const user = await User.findOne({ email: email.toLowerCase(), accountVerified: true });
  if (!user) return next(new ErrorHandler("User not found", 404));

  if (book.quantity === 0) return next(new ErrorHandler("Book not available", 400));

  const latestBorrow = await Borrow.findOne({
    book: id,
    user: user._id,
  }).sort({ borrowDate: -1 });

  if (latestBorrow && !latestBorrow.returnDate) {
    return next(new ErrorHandler("You have already borrowed this book", 400));
  }

  book.quantity -= 1;
  book.available = book.quantity > 0;
  await book.save();

  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const borrowRecord = await Borrow.create({
    user: user._id,
    name: user.name,
    email: user.email,
    book: book._id,
    dueDate,
    price: book.price,
  });

  if (!Array.isArray(user.BorrowBooks)) {
    user.BorrowBooks = [];
  }

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
    message: "Book borrowed successfully",
    borrow: borrowRecord,
  });
});

// Return a book
export const returnBorrowBook = catchAsyncErrors(async (req, res, next) => {
  const { bookId } = req.params;
  const { email } = req.body;

  const book = await Book.findById(bookId);
  if (!book) return next(new ErrorHandler("Book not found", 404));

  const user = await User.findOne({ email: email.toLowerCase(), accountVerified: true });
  if (!user) return next(new ErrorHandler("User not found", 404));

  const borrowedBook = await Borrow.findOne({
    book: bookId,
    user: user._id,
  }).sort({ borrowDate: -1 });

  if (!borrowedBook) return next(new ErrorHandler("You have not borrowed this book", 400));

  if (borrowedBook.returnDate) {
    return next(new ErrorHandler("You have already returned this book.", 400));
  }

  book.quantity += 1;
  book.available = true;
  await book.save();

  borrowedBook.returnDate = new Date();
  const { fine, message: fineMessage } = fineCalculator(borrowedBook.dueDate, borrowedBook.returnDate);
  borrowedBook.fine = fine;
  await borrowedBook.save();

  if (Array.isArray(user.BorrowBooks)) {
    user.BorrowBooks = user.BorrowBooks.map((entry) => {
      if (entry.bookId.toString() === borrowedBook._id.toString()) {
        entry.returned = true;
      }
      return entry;
    });
  }

  await user.save();

  res.status(200).json({
    success: true,
    message:
      fine !== 0
        ? `The book has been returned successfully. The total charges, including a fine are ₹${fine + book.price}`
        : `The book has been returned successfully. The total charges are ₹${book.price}`,
    fineDetails: {
      fine,
      note: fineMessage,
      totalCharge: fine + book.price,
    },
  });
});

// ✅ Get borrowed books by email only
export const borrowedBooks = catchAsyncErrors(async (req, res, next) => {
  const email = req.query.email;

  if (!email) {
    return next(new ErrorHandler("Email is required to fetch borrowed books", 400));
  }

  const user = await User.findOne({ email: email.toLowerCase(), accountVerified: true });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const borrows = await Borrow.find({ user: user._id })
    .populate("book")
    .sort({ borrowDate: -1 });

  res.status(200).json({
    success: true,
    borrowedBooks: borrows,
  });
});

// Get all borrowed books for admin
export const getBorrowedBooksForAdmin = catchAsyncErrors(async (req, res, next) => {
  const borrowedBooks = await Borrow.find()
    .populate("book user") // Full details for admin
    .sort({ borrowDate: -1 });

  res.status(200).json({
    success: true,
    borrowedBooks,
  });
});
