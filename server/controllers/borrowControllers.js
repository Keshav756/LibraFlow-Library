// 📚 Enhanced Borrowing System Controllers
// Integrated with Unified Fine Management System

import mongoose from "mongoose";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { Borrow } from "../models/borrowModels.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { Book } from "../models/bookModels.js";
import { User } from "../models/userModels.js";
import { UnifiedFineManager as FineManager, FINE_CONFIG, fineCalculator } from "../utils/fineCalculator.js";

/**
 * 📚 Enhanced Book Borrowing
 * POST /record-borrow-book/:id
 * Integrated with smart availability tracking
 */
export const recordBorrowedBook = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { email } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Book ID", 400));
  }

  const book = await Book.findById(id);
  if (!book) return next(new ErrorHandler("Book not found", 404));

  const user = await User.findOne({
    email: email.toLowerCase(),
    accountVerified: true,
  });
  if (!user) return next(new ErrorHandler("User not found", 404));

  // Enhanced availability check using new book model
  if (!book.isAvailableForBorrow()) {
    return next(new ErrorHandler(
      `Book not available. Available copies: ${book.availableCopies}`, 
      400
    ));
  }

  // Check if user already has this book borrowed
  const existingBorrow = await Borrow.findOne({
    book: id,
    user: user._id,
    returnDate: null // Not returned yet
  });

  if (existingBorrow) {
    return next(new ErrorHandler("You have already borrowed this book", 400));
  }

  // Check user's borrowing limits and outstanding fines
  const userBorrows = await Borrow.find({ 
    user: user._id, 
    returnDate: null 
  });
  
  const maxBorrowLimit = getUserBorrowLimit(user.role);
  if (userBorrows.length >= maxBorrowLimit) {
    return next(new ErrorHandler(
      `Borrowing limit reached. Maximum ${maxBorrowLimit} books allowed.`, 
      400
    ));
  }

  // Check outstanding fines
  const outstandingFines = await Borrow.aggregate([
    { $match: { user: user._id, fine: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: '$fine' } } }
  ]);
  
  const totalOutstanding = outstandingFines[0]?.total || 0;
  if (totalOutstanding > FINE_CONFIG.MAX_FINES.PER_USER_TOTAL * 0.8) {
    return next(new ErrorHandler(
      `Outstanding fines too high: ₹${totalOutstanding.toFixed(2)}. Please clear fines before borrowing.`,
      400
    ));
  }

  // Update book availability using new model methods
  await book.updateAvailability('borrow', 1);

  // Set due date based on user type
  const loanPeriod = getLoanPeriod(user.role);
  const dueDate = new Date(Date.now() + loanPeriod * 24 * 60 * 60 * 1000);

  // Create borrow record with enhanced metadata
  const borrowRecord = await Borrow.create({
    user: user._id,
    name: user.name,
    email: user.email,
    book: book._id,
    dueDate,
    price: book.price,
    borrowDate: new Date(),
    fine: 0,
    metadata: {
      userRole: user.role,
      loanPeriod,
      bookCategory: book.genre,
      borrowedBy: {
        id: req.user?._id || user._id,
        role: req.user?.role || user.role
      }
    }
  });

  // Enhanced user record update
  if (!Array.isArray(user.BorrowBooks)) user.BorrowBooks = [];

  user.BorrowBooks.push({
    bookId: book._id,
    borrowRecordId: borrowRecord._id,
    returned: false,
    bookTitle: book.title || "Untitled",
    BorrowedDate: borrowRecord.borrowDate,
    DueDate: borrowRecord.dueDate,
    loanPeriod,
    category: book.genre
  });

  await user.save();

  console.log(`📚 Book borrowed: "${book.title}" by ${user.name} (${user.email})`);

  res.status(200).json({
    success: true,
    message: "Book borrowed successfully",
    data: {
      borrow: {
        id: borrowRecord._id,
        book: {
          id: book._id,
          title: book.title,
          author: book.author
        },
        user: {
          name: user.name,
          email: user.email
        },
        borrowDate: borrowRecord.borrowDate,
        dueDate: borrowRecord.dueDate,
        loanPeriod: `${loanPeriod} days`,
        price: book.price
      },
      bookAvailability: {
        totalQuantity: book.quantity,
        availableCopies: book.availableCopies,
        borrowedCount: book.availability.borrowedCount
      }
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * 🔄 Enhanced Book Return with Smart Fine Calculation
 * PUT /return-borrow-book/:bookId
 * Integrated with unified fine management system
 */
export const returnBorrowBook = catchAsyncErrors(async (req, res, next) => {
  const { bookId } = req.params;
  const { email } = req.body;

  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return next(new ErrorHandler("Invalid Book ID", 400));
  }

  if (!email) return next(new ErrorHandler("User email is required", 400));

  const book = await Book.findById(bookId);
  if (!book) return next(new ErrorHandler("Book not found", 404));

  const user = await User.findOne({ 
    email: email.toLowerCase(), 
    accountVerified: true 
  });
  if (!user) return next(new ErrorHandler("User not found", 404));

  // Find the active borrow record
  const borrowedBook = await Borrow.findOne({ 
    book: bookId, 
    user: user._id,
    returnDate: null // Not returned yet
  }).sort({ borrowDate: -1 });
  
  if (!borrowedBook) {
    return next(new ErrorHandler("You have not borrowed this book or it's already returned", 400));
  }

  // Set return date
  const returnDate = new Date();
  borrowedBook.returnDate = returnDate;

  // Calculate fine using unified system
  let fineAmount = 0;
  let fineMessage = '';
  let fineStatus = 'none';

  try {
    // Calculate fine using advanced system
    const fineCalc = await FineManager.calculateFine({ borrowId: borrowedBook._id });
    fineAmount = fineCalc.totalFine;
    fineMessage = fineCalc.message;
    fineStatus = fineCalc.status;
  } catch (error) {
    console.warn("Advanced fine calculation failed for borrow:", error.message);
    // Fallback to simple calculation
    const simpleFine = fineCalculator(borrowedBook.dueDate, new Date());
    fineAmount = simpleFine.fine;
    fineMessage = simpleFine.message;
    fineStatus = simpleFine.status;
  }

  // Update borrow record with fine details
  borrowedBook.fine = fineAmount;
  borrowedBook.fineCalculation = {
    totalFine: fineAmount,
    message: fineMessage,
    status: fineStatus
  };
  borrowedBook.lastFineUpdate = new Date();
  await borrowedBook.save();

  // Update book availability using new model methods
  await book.updateAvailability('return', 1);

  // Update user's BorrowBooks array
  if (Array.isArray(user.BorrowBooks)) {
    user.BorrowBooks = user.BorrowBooks.map((entry) =>
      entry.borrowRecordId?.toString() === borrowedBook._id.toString()
        ? { 
            ...entry, 
            returned: true, 
            returnDate: returnDate,
            fine: fineAmount
          }
        : entry
    );
  }
  await user.save();

  // Calculate total charges
  const totalCharge = fineAmount + book.price;
  
  // Generate return summary
  const returnSummary = {
    book: {
      id: book._id,
      title: book.title,
      author: book.author,
      price: book.price
    },
    borrowPeriod: {
      borrowDate: borrowedBook.borrowDate,
      dueDate: borrowedBook.dueDate,
      returnDate: returnDate,
      daysOverdue: fineCalc ? (fineCalc.daysOverdue || 0) : 0
    },
    charges: {
      bookPrice: book.price,
      fine: fineAmount,
      total: totalCharge,
      currency: '₹'
    },
    fineDetails: fineCalc ? {
      ...fineCalc,
      formatted: `₹${fineCalc.totalFine.toFixed(2)}`
    } : {
      totalFine: fineAmount,
      formatted: `₹${fineAmount.toFixed(2)}`
    }
  };

  console.log(`🔄 Book returned: "${book.title}" by ${user.name}, Fine: ₹${fineAmount.toFixed(2)}`);

  const responseMessage = fineAmount > 0
    ? `Book returned with fine. ${fineMessage || ''} Total charge: ₹${totalCharge.toFixed(2)}`
    : `Book returned successfully! ${fineMessage || ''} Total charge: ₹${book.price.toFixed(2)}`;

  res.status(200).json({
    success: true,
    message: responseMessage,
    data: {
      return: returnSummary,
      bookAvailability: {
        totalQuantity: book.quantity,
        availableCopies: book.availableCopies,
        borrowedCount: book.availability.borrowedCount
      }
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * 📊 Enhanced Get Borrowed Books for User
 * GET /my-borrowed-books?email=...
 * Enhanced with fine calculations and detailed metadata
 */
export const borrowedBooks = catchAsyncErrors(async (req, res, next) => {
  const email = req.query.email;
  if (!email) {
    return next(new ErrorHandler("Email is required", 400));
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
    accountVerified: true,
  });
  if (!user) return next(new ErrorHandler("User not found", 404));

  // Get borrows with enhanced data
  const borrows = await Borrow.find({ user: user._id })
    .populate("book", "title author genre coverImage price")
    .sort({ borrowDate: -1 });

  // Calculate current fines for unreturned books
  const enhancedBorrows = await Promise.all(
    borrows.map(async (borrow) => {
      let currentFine = borrow.fine || 0;
      let fineStatus = 'none';
      
      // Calculate current fine for unreturned books
      if (!borrow.returnDate && new Date() > new Date(borrow.dueDate)) {
        try {
          const fineCalc = await FineManager.calculateFine({ borrowId: borrow._id });
          currentFine = fineCalc.totalFine;
          fineStatus = currentFine > 0 ? 'overdue' : 'none';
        } catch (error) {
          // Fallback to simple calculation
          const simpleFine = fineCalculator(borrow.dueDate, new Date());
          currentFine = simpleFine.fine / 100;
          fineStatus = currentFine > 0 ? 'overdue' : 'none';
        }
      } else if (borrow.returnDate) {
        fineStatus = borrow.fine > 0 ? 'paid' : 'none';
      }

      return {
        ...borrow.toObject(),
        currentFine,
        fineStatus,
        daysOverdue: !borrow.returnDate ? 
          Math.max(0, Math.ceil((new Date() - new Date(borrow.dueDate)) / (1000 * 60 * 60 * 24))) : 0,
        status: borrow.returnDate ? 'returned' : 'borrowed'
      };
    })
  );

  // Calculate summary statistics
  const summary = {
    total: borrows.length,
    active: enhancedBorrows.filter(b => !b.returnDate).length,
    returned: enhancedBorrows.filter(b => b.returnDate).length,
    overdue: enhancedBorrows.filter(b => !b.returnDate && new Date() > new Date(b.dueDate)).length,
    totalFines: enhancedBorrows.reduce((sum, b) => sum + (b.currentFine || 0), 0)
  };

  res.status(200).json({
    success: true,
    message: `Retrieved ${borrows.length} borrow record(s) for ${user.name}`,
    data: {
      user: {
        name: user.name,
        email: user.email
      },
      summary,
      borrowedBooks: enhancedBorrows
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * 📈 Enhanced Get All Borrowed Books for Admin
 * GET /admin/borrowed-books
 * Enhanced with analytics and filtering options
 */
export const getBorrowedBooksForAdmin = catchAsyncErrors(
  async (req, res, next) => {
    const {
      status, // 'all', 'active', 'returned', 'overdue'
      page = 1,
      limit = 20,
      sortBy = 'borrowDate',
      sortOrder = 'desc',
      includeAnalytics = false
    } = req.query;

    // Build query based on status filter
    let query = {};
    switch (status) {
      case 'active':
        query.returnDate = null;
        break;
      case 'returned':
        query.returnDate = { $exists: true, $ne: null };
        break;
      case 'overdue':
        query.returnDate = null;
        query.dueDate = { $lt: new Date() };
        break;
      default: // 'all'
        break;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get borrowed books with pagination
    const borrowedBooks = await Borrow.find(query)
      .populate("book", "title author genre coverImage price")
      .populate("user", "name email role")
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip);

    // Get total count for pagination
    const totalBooks = await Borrow.countDocuments(query);
    const totalPages = Math.ceil(totalBooks / limitNum);

    // Enhance with current fine calculations for active borrows
    const enhancedBooks = await Promise.all(
      borrowedBooks.map(async (borrow) => {
        let currentFine = borrow.fine || 0;
        let status = 'returned';
        
        if (!borrow.returnDate) {
          status = new Date() > new Date(borrow.dueDate) ? 'overdue' : 'active';
          
          // Calculate current fine for overdue books
          if (status === 'overdue') {
            try {
              const fineCalc = await FineManager.calculateFine({ borrowId: borrow._id });
              currentFine = fineCalc.totalFine;
            } catch (error) {
              console.warn(`⚠️ Could not calculate fine for ${borrow._id}:`, error.message);
            }
          }
        }

        return {
          ...borrow.toObject(),
          currentFine,
          status,
          daysOverdue: !borrow.returnDate ? 
            Math.max(0, Math.ceil((new Date() - new Date(borrow.dueDate)) / (1000 * 60 * 60 * 24))) : 0
        };
      })
    );

    let analytics = null;
    if (includeAnalytics === 'true') {
      // Calculate system-wide analytics
      const stats = await Borrow.aggregate([
        {
          $group: {
            _id: null,
            totalBorrows: { $sum: 1 },
            activeBorrows: {
              $sum: { $cond: [{ $eq: ['$returnDate', null] }, 1, 0] }
            },
            returnedBorrows: {
              $sum: { $cond: [{ $ne: ['$returnDate', null] }, 1, 0] }
            },
            totalFines: { $sum: '$fine' },
            averageFine: { $avg: '$fine' }
          }
        }
      ]);

      const overdueBorrows = await Borrow.countDocuments({
        returnDate: null,
        dueDate: { $lt: new Date() }
      });

      analytics = {
        ...stats[0],
        overdueBorrows,
        onTimeReturnRate: stats[0] ? 
          ((stats[0].returnedBorrows / stats[0].totalBorrows) * 100).toFixed(2) : 0
      };
    }

    res.status(200).json({
      success: true,
      message: `Retrieved ${enhancedBooks.length} borrow record(s)`,
      data: {
        borrowedBooks: enhancedBooks,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalBooks,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: limitNum
        },
        filters: {
          status: status || 'all',
          sortBy,
          sortOrder
        },
        analytics
      },
      timestamp: new Date().toISOString()
    });
  }
);

/**
 * 🛠️ Helper Functions
 */

/**
 * Get user borrow limit based on role
 */
function getUserBorrowLimit(role) {
  const limits = {
    'Admin': 20,
    'Faculty': 10,
    'Student': 5,
    'User': 3
  };
  return limits[role] || limits['User'];
}

/**
 * Get loan period based on user role
 */
function getLoanPeriod(role) {
  const periods = {
    'Admin': 90,   // 3 months
    'Faculty': 60, // 2 months
    'Student': 30, // 1 month
    'User': 14     // 2 weeks
  };
  return periods[role] || periods['User'];
}