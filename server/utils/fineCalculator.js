// 🎯 Unified Fine Management System - All-in-One Solution
// Complete fine calculation, payment processing, analytics, and API management
// Merged implementation combining advanced features with streamlined performance

import express from 'express';
import moment from 'moment';
import { Borrow } from '../models/borrowModels.js';
import { User } from '../models/userModels.js';
import ErrorHandler from '../middlewares/errorMiddlewares.js';
import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import { isAuthenticated, isAuthorized } from '../middlewares/authMiddleware.js';
import { 
  validateObjectId,
  validateFinePayment,
  validateBulkCalculation,
  validateAmnestyRequest
} from '../middlewares/validation.js';
import { adminRateLimit, generalRateLimit } from '../middlewares/security.js';
import { createOrder, verifyPayment } from './razorpayService.js';

/**
 * 📊 Fine Configuration
 */
export const FINE_CONFIG = {
  // Base fine rates (per day)
  RATES: {
    STANDARD: 0.50,      // Regular books
    PREMIUM: 1.00,       // New releases, special collections
    ACADEMIC: 0.25,      // Academic books for students
    REFERENCE: 2.00      // Reference materials
  },
  
  // Grace periods (days)
  GRACE_PERIODS: {
    STUDENT: 2,          // Students get 2 days grace
    FACULTY: 3,          // Faculty get 3 days grace
    ADMIN: 5,            // Admin get 5 days grace
    STANDARD: 1          // Regular users get 1 day grace
  },
  
  // Maximum fine caps
  MAX_FINES: {
    PER_BOOK: 50.00,     // Maximum fine per book
    PER_USER_MONTHLY: 200.00,  // Maximum fine per user per month
    PER_USER_TOTAL: 500.00     // Maximum total outstanding fine
  },
  
  // Role-based exemptions
  EXEMPTIONS: {
    STUDENT: {
      firstTimeBorrower: 0.5, // 50% discount
      excellentHistory: 0.25, // 25% discount
      researchProject: 0.30   // 30% discount
    },
    FACULTY: {
      research: 0.50,         // 50% discount
      sabbatical: 0.75        // 75% discount
    },
    ADMIN: {
      staff: 0.25             // 25% discount
    }
  },
  
  // Exemption conditions
  SPECIAL_EXEMPTIONS: {
    FIRST_TIME_BORROWER: true,    // First-time borrowers get 1 exemption
    EXCELLENT_HISTORY: true,      // Users with excellent history get reduced fines
    FACULTY_RESEARCH: true,       // Faculty research books have different rules
    SYSTEM_DOWNTIME: true         // Exemptions during system maintenance
  },
  
  // Holiday and special day configurations
  SPECIAL_DAYS: {
    EXCLUDE_WEEKENDS: true,       // Don't count weekends in fine calculation
    EXCLUDE_HOLIDAYS: true,       // Don't count holidays
    LIBRARY_CLOSED_DAYS: []       // Days when library was closed
  },
  
  // Payment and forgiveness options
  PAYMENT: {
    PARTIAL_PAYMENTS: true,       // Allow partial fine payments
    COMMUNITY_SERVICE: true,      // Allow community service instead of payment
    BOOK_DONATION: true,          // Accept book donations to reduce fines
    ACADEMIC_AMNESTY: true        // Periodic amnesty programs
  },
  
  // 📅 Holiday policies (non-working days when fines don't accrue)
  HOLIDAYS: {
    // Fixed holidays (month is 0-indexed, so 0 = January)
    fixed: [
      { month: 0, day: 1 },    // New Year's Day
      { month: 0, day: 26 },   // Republic Day
      { month: 7, day: 15 },   // Independence Day
      { month: 9, day: 2 },    // Gandhi Jayanti
      { month: 11, day: 25 }   // Christmas
    ],
    // Floating holidays (e.g., second Saturday of each month)
    floating: [
      { type: 'secondSaturday' }
    ],
    // Weekend policy (0 = Sunday, 6 = Saturday)
    weekends: [0, 6] // Sunday and Saturday
  }
};

/**
 * Holiday and Special Day Manager
 */
export class HolidayManager {
  static holidays = [
    // US Federal Holidays
    { name: "New Year's Day", date: "01-01" },
    { name: "Martin Luther King Jr. Day", date: "01-15" }, // Third Monday in January
    { name: "Presidents' Day", date: "02-19" }, // Third Monday in February
    { name: "Memorial Day", date: "05-27" }, // Last Monday in May
    { name: "Independence Day", date: "07-04" },
    { name: "Labor Day", date: "09-02" }, // First Monday in September
    { name: "Columbus Day", date: "10-14" }, // Second Monday in October
    { name: "Veterans Day", date: "11-11" },
    { name: "Thanksgiving", date: "11-28" }, // Fourth Thursday in November
    { name: "Christmas Day", date: "12-25" }
  ];
  
  static isHoliday(date) {
    const checkDate = moment(date);
    return this.holidays.some(holiday => {
      const holidayDate = moment(`${checkDate.year()}-${holiday.date}`);
      return checkDate.isSame(holidayDate, 'day');
    });
  }
  
  static isWeekend(date) {
    const day = moment(date).day();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  }
  
  static isLibraryClosed(date) {
    return this.isHoliday(date) || 
           (FINE_CONFIG.SPECIAL_DAYS.EXCLUDE_WEEKENDS && this.isWeekend(date)) ||
           FINE_CONFIG.SPECIAL_DAYS.LIBRARY_CLOSED_DAYS.some(closedDate => 
             moment(date).isSame(moment(closedDate), 'day')
           );
  }
  
  static getBusinessDaysBetween(startDate, endDate) {
    let current = moment(startDate);
    const end = moment(endDate);
    let businessDays = 0;
    
    while (current.isBefore(end)) {
      if (!this.isLibraryClosed(current)) {
        businessDays++;
      }
      current.add(1, 'day');
    }
    
    return businessDays;
  }
}

/**
 * User Classification and History Manager
 */
export class UserClassifier {
  static async getUserType(userId) {
    const user = await User.findById(userId);
    if (!user) return 'STANDARD';
    
    // Check if user has any classification metadata
    if (user.classification) {
      return user.classification.toUpperCase();
    }
    
    // Determine based on email domain or role
    if (user.role === 'Admin') return 'ADMIN';
    
    const emailDomain = user.email.split('@')[1];
    const academicDomains = ['.edu', '.ac.', 'university', 'college'];
    
    if (academicDomains.some(domain => emailDomain.includes(domain))) {
      return 'STUDENT';
    }
    
    return 'STANDARD';
  }
  
  static async getBorrowingHistory(userId) {
    const history = await Borrow.find({ user: userId })
      .populate('book')
      .sort({ borrowDate: -1 })
      .limit(50);
    
    const stats = {
      totalBorrows: history.length,
      onTimeReturns: 0,
      lateReturns: 0,
      currentlyOverdue: 0,
      totalFinesPaid: 0,
      averageReturnDelay: 0
    };
    
    let totalDelay = 0;
    
    history.forEach(borrow => {
      if (borrow.returnDate) {
        const dueDate = moment(borrow.dueDate);
        const returnDate = moment(borrow.returnDate);
        
        if (returnDate.isAfter(dueDate)) {
          stats.lateReturns++;
          totalDelay += returnDate.diff(dueDate, 'days');
        } else {
          stats.onTimeReturns++;
        }
        
        stats.totalFinesPaid += borrow.fine || 0;
      } else {
        // Currently borrowed
        const dueDate = moment(borrow.dueDate);
        if (moment().isAfter(dueDate)) {
          stats.currentlyOverdue++;
        }
      }
    });
    
    if (stats.lateReturns > 0) {
      stats.averageReturnDelay = totalDelay / stats.lateReturns;
    }
    
    // Calculate reliability score (0-100)
    stats.reliabilityScore = stats.totalBorrows > 0 ? 
      Math.round((stats.onTimeReturns / stats.totalBorrows) * 100) : 100;
    
    return stats;
  }
  
  static async hasExcellentHistory(userId) {
    const history = await this.getBorrowingHistory(userId);
    return history.reliabilityScore >= 90 && history.totalBorrows >= 5;
  }
  
  static async isFirstTimeBorrower(userId) {
    const borrowCount = await Borrow.countDocuments({ user: userId });
    return borrowCount <= 1;
  }
}

/**
 * 🧮 Basic Fine Calculator Function (Legacy Support)
 */
export const fineCalculator = (
  dueDate,
  returnDate = new Date(),
  finePerDay = 25,
  gracePeriodDays = 1,
  currencySymbol = "₹"
) => {
  // Handle null or invalid due dates
  if (!dueDate) {
    return {
      fine: 0,
      message: '🌟 No fine - no due date set!',
      status: 'success'
    };
  }
  
  const due = new Date(dueDate);
  const returned = new Date(returnDate);
  
  // Handle future due dates
  if (due > returned) {
    return {
      fine: 0,
      message: '🌟 No fine - due date is in the future!',
      status: 'success'
    };
  }
  
  due.setHours(0, 0, 0, 0);
  returned.setHours(0, 0, 0, 0);
  
  const diffTime = returned.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    return {
      fine: 0,
      message: '🌟 No fine - returned on time!',
      status: 'success'
    };
  }
  
  if (diffDays <= gracePeriodDays) {
    return {
      fine: 0,
      message: '🕊️ Grace period - No fine',
      status: 'grace'
    };
  }
  
  const overdueDays = diffDays - gracePeriodDays;
  const fineAmount = finePerDay * overdueDays;
  const totalFineDisplay = (fineAmount / 100).toFixed(2);
  
  return {
    fine: fineAmount,
    message: `⚠️ Fine: ${currencySymbol}${totalFineDisplay}`,
    status: 'overdue',
    daysOverdue: diffDays,
    gracePeriod: gracePeriodDays
  };
};

/**
 * 🎯 Quick Access Fine Calculator (for simple cases)
 */
export const quickFine = (dueDate, returnDate = new Date()) => {
  return fineCalculator(dueDate, returnDate);
};

/**
 * 🎯 Advanced Fine Calculator
 */
export class AdvancedFineCalculator {
  /**
   * Calculate comprehensive fine for a borrow record
   */
  static async calculateFine(borrowId) {
    const borrow = await Borrow.findById(borrowId)
      .populate('user')
      .populate('book');
    
    if (!borrow) {
      throw new Error('Borrow record not found');
    }
    
    // Handle null or invalid due dates
    if (!borrow.dueDate) {
      return {
        totalFine: 0,
        dailyRate: 0,
        daysOverdue: 0,
        effectiveOverdueDays: 0,
        gracePeriod: 0,
        userType: 'STANDARD',
        exemptions: [],
        userHistory: {},
        breakdown: {
          baseFine: 0,
          gracePeriodDiscount: 0,
          exemptionDiscount: 0,
          holidayExclusions: 0,
          finalFine: 0
        },
        caps: {
          monthlyLimit: FINE_CONFIG.MAX_FINES.PER_USER_MONTHLY,
          totalLimit: FINE_CONFIG.MAX_FINES.PER_USER_TOTAL,
          perBookLimit: FINE_CONFIG.MAX_FINES.PER_BOOK,
          currentMonthlyFines: 0,
          currentTotalOutstanding: 0
        }
      };
    }
    
    const dueDate = moment(borrow.dueDate);
    const currentDate = moment();
    const returnDate = borrow.returnDate ? moment(borrow.returnDate) : currentDate;
    
    // Handle future due dates
    if (dueDate.isAfter(currentDate)) {
      return {
        totalFine: 0,
        dailyRate: 0,
        daysOverdue: 0,
        effectiveOverdueDays: 0,
        gracePeriod: 0,
        userType: 'STANDARD',
        exemptions: [],
        userHistory: {},
        breakdown: {
          baseFine: 0,
          gracePeriodDiscount: 0,
          exemptionDiscount: 0,
          holidayExclusions: 0,
          finalFine: 0
        },
        caps: {
          monthlyLimit: FINE_CONFIG.MAX_FINES.PER_USER_MONTHLY,
          totalLimit: FINE_CONFIG.MAX_FINES.PER_USER_TOTAL,
          perBookLimit: FINE_CONFIG.MAX_FINES.PER_BOOK,
          currentMonthlyFines: 0,
          currentTotalOutstanding: 0
        }
      };
    }
    
    // If returned on time or before due date
    if (returnDate.isSameOrBefore(dueDate)) {
      return {
        totalFine: 0,
        dailyRate: 0,
        daysOverdue: 0,
        effectiveOverdueDays: 0,
        gracePeriod: 0,
        userType: 'STANDARD',
        exemptions: [],
        userHistory: {},
        breakdown: {
          baseFine: 0,
          gracePeriodDiscount: 0,
          exemptionDiscount: 0,
          holidayExclusions: 0,
          finalFine: 0
        },
        caps: {
          monthlyLimit: FINE_CONFIG.MAX_FINES.PER_USER_MONTHLY,
          totalLimit: FINE_CONFIG.MAX_FINES.PER_USER_TOTAL,
          perBookLimit: FINE_CONFIG.MAX_FINES.PER_BOOK,
          currentMonthlyFines: 0,
          currentTotalOutstanding: 0
        }
      };
    }
    
    // Get user type and history
    const userType = await UserClassifier.getUserType(borrow.user._id);
    const userHistory = await UserClassifier.getBorrowingHistory(borrow.user._id);
    const hasExcellentHistory = await UserClassifier.hasExcellentHistory(borrow.user._id);
    const isFirstTime = await UserClassifier.isFirstTimeBorrower(borrow.user._id);
    
    // Determine fine rate based on book type
    let dailyRate = FINE_CONFIG.RATES.STANDARD;
    
    if (borrow.book && borrow.book.category) {
      const category = borrow.book.category.toLowerCase();
      if (category.includes('reference')) {
        dailyRate = FINE_CONFIG.RATES.REFERENCE;
      } else if (category.includes('academic') || category.includes('textbook')) {
        dailyRate = FINE_CONFIG.RATES.ACADEMIC;
      } else if (category.includes('new') || category.includes('premium')) {
        dailyRate = FINE_CONFIG.RATES.PREMIUM;
      }
    }
    
    // Calculate actual overdue days (excluding holidays/weekends if configured)
    let daysOverdue;
    if (FINE_CONFIG.SPECIAL_DAYS.EXCLUDE_HOLIDAYS || FINE_CONFIG.SPECIAL_DAYS.EXCLUDE_WEEKENDS) {
      daysOverdue = HolidayManager.getBusinessDaysBetween(dueDate, returnDate);
    } else {
      daysOverdue = returnDate.diff(dueDate, 'days');
    }
    
    // Apply grace period
    const gracePeriod = FINE_CONFIG.GRACE_PERIODS[userType] || FINE_CONFIG.GRACE_PERIODS.STANDARD;
    const effectiveOverdueDays = Math.max(0, daysOverdue - gracePeriod);
    
    // Calculate base fine
    let baseFine = effectiveOverdueDays * dailyRate;
    
    // Track exemptions and discounts
    const exemptions = [];
    let exemptionDiscount = 0;
    
    // First-time borrower exemption
    if (isFirstTime && FINE_CONFIG.SPECIAL_EXEMPTIONS.FIRST_TIME_BORROWER) {
      exemptions.push('FIRST_TIME_BORROWER');
      exemptionDiscount += baseFine * 0.5; // 50% discount
    }
    
    // Excellent history discount
    if (hasExcellentHistory && FINE_CONFIG.SPECIAL_EXEMPTIONS.EXCELLENT_HISTORY) {
      exemptions.push('EXCELLENT_HISTORY');
      exemptionDiscount += baseFine * 0.25; // 25% discount
    }
    
    // Faculty research exemption
    if (userType === 'FACULTY' && FINE_CONFIG.SPECIAL_EXEMPTIONS.FACULTY_RESEARCH) {
      exemptions.push('FACULTY_RESEARCH');
      exemptionDiscount += baseFine * 0.3; // 30% discount
    }
    
    // Apply exemptions
    let finalFine = Math.max(0, baseFine - exemptionDiscount);
    
    // Apply per-book maximum
    finalFine = Math.min(finalFine, FINE_CONFIG.MAX_FINES.PER_BOOK);
    
    // Check monthly and total limits
    const monthlyFines = await this.getMonthlyFines(borrow.user._id);
    const totalOutstanding = await this.getTotalOutstandingFines(borrow.user._id);
    
    if (monthlyFines + finalFine > FINE_CONFIG.MAX_FINES.PER_USER_MONTHLY) {
      finalFine = Math.max(0, FINE_CONFIG.MAX_FINES.PER_USER_MONTHLY - monthlyFines);
      exemptions.push('MONTHLY_CAP_REACHED');
    }
    
    if (totalOutstanding + finalFine > FINE_CONFIG.MAX_FINES.PER_USER_TOTAL) {
      finalFine = Math.max(0, FINE_CONFIG.MAX_FINES.PER_USER_TOTAL - totalOutstanding);
      exemptions.push('TOTAL_CAP_REACHED');
    }
    
    return {
      totalFine: Math.round(finalFine * 100) / 100, // Round to 2 decimal places
      dailyRate,
      daysOverdue,
      effectiveOverdueDays,
      gracePeriod,
      userType,
      exemptions,
      userHistory,
      breakdown: {
        baseFine: Math.round(baseFine * 100) / 100,
        gracePeriodDiscount: Math.round((daysOverdue - effectiveOverdueDays) * dailyRate * 100) / 100,
        exemptionDiscount: Math.round(exemptionDiscount * 100) / 100,
        holidayExclusions: Math.round((returnDate.diff(dueDate, 'days') - daysOverdue) * dailyRate * 100) / 100,
        finalFine: Math.round(finalFine * 100) / 100
      },
      caps: {
        monthlyLimit: FINE_CONFIG.MAX_FINES.PER_USER_MONTHLY,
        totalLimit: FINE_CONFIG.MAX_FINES.PER_USER_TOTAL,
        perBookLimit: FINE_CONFIG.MAX_FINES.PER_BOOK,
        currentMonthlyFines: monthlyFines,
        currentTotalOutstanding: totalOutstanding
      }
    };
  }
  
  /**
   * Get total fines for current month
   */
  static async getMonthlyFines(userId) {
    const startOfMonth = moment().startOf('month');
    const endOfMonth = moment().endOf('month');
    
    const borrows = await Borrow.find({
      user: userId,
      borrowDate: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() }
    });
    
    return borrows.reduce((total, borrow) => total + (borrow.fine || 0), 0);
  }
  
  /**
   * Get total outstanding fines
   */
  static async getTotalOutstandingFines(userId) {
    const borrows = await Borrow.find({
      user: userId,
      $or: [
        { returnDate: null }, // Not returned yet
        { fine: { $gt: 0 } }  // Has unpaid fines
      ]
    });
    
    return borrows.reduce((total, borrow) => total + (borrow.fine || 0), 0);
  }
  
  /**
   * Update fine for a specific borrow record
   */
  static async updateBorrowFine(borrowId) {
    const fineCalculation = await this.calculateFine(borrowId);
    
    await Borrow.findByIdAndUpdate(borrowId, {
      fine: fineCalculation.totalFine,
      fineCalculation: fineCalculation,
      lastFineUpdate: new Date()
    });
    
    return fineCalculation;
  }
  
  /**
   * Bulk update fines for all overdue books
   */
  static async updateAllOverdueFines() {
    const overdueBooks = await Borrow.find({
      returnDate: null,
      dueDate: { $lt: new Date() }
    });
    
    const updates = [];
    
    for (const borrow of overdueBooks) {
      try {
        const fineCalculation = await this.calculateFine(borrow._id);
        updates.push({
          borrowId: borrow._id,
          oldFine: borrow.fine || 0,
          newFine: fineCalculation.totalFine,
          calculation: fineCalculation
        });
        
        await Borrow.findByIdAndUpdate(borrow._id, {
          fine: fineCalculation.totalFine,
          fineCalculation: fineCalculation,
          lastFineUpdate: new Date()
        });
      } catch (error) {
        console.error(`Error updating fine for borrow ${borrow._id}:`, error);
      }
    }
    
    return {
      updatedCount: updates.length,
      totalFinesBefore: updates.reduce((sum, u) => sum + u.oldFine, 0),
      totalFinesAfter: updates.reduce((sum, u) => sum + u.newFine, 0),
      updates
    };
  }
  
  /**
   * Generate fine report for a user
   */
  static async generateUserFineReport(userId) {
    // Validate userId
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      throw new Error('Invalid user ID format');
    }
    
    const user = await User.findById(userId);
    
    // Handle case where user is not found
    if (!user) {
      throw new Error('User not found');
    }
    
    const borrows = await Borrow.find({ user: userId })
      .populate('book')
      .sort({ borrowDate: -1 });
    
    const userHistory = await UserClassifier.getBorrowingHistory(userId);
    const monthlyFines = await AdvancedFineCalculator.getMonthlyFines(userId);
    const totalOutstanding = await AdvancedFineCalculator.getTotalOutstandingFines(userId);
    
    const report = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        type: await UserClassifier.getUserType(userId)
      },
      summary: {
        totalBorrows: borrows.length,
        currentOverdue: borrows.filter(b => !b.returnDate && moment().isAfter(b.dueDate)).length,
        monthlyFines,
        totalOutstanding,
        reliabilityScore: userHistory.reliabilityScore
      },
      fineHistory: borrows.filter(b => b.fine > 0).map(borrow => ({
        book: borrow.book?.title || 'Unknown Book',
        borrowDate: borrow.borrowDate,
        dueDate: borrow.dueDate,
        returnDate: borrow.returnDate,
        fine: borrow.fine,
        calculation: borrow.fineCalculation
      })),
      exemptions: {
        firstTimeBorrower: await UserClassifier.isFirstTimeBorrower(userId),
        excellentHistory: await UserClassifier.hasExcellentHistory(userId)
      },
      limits: {
        monthlyLimit: FINE_CONFIG.MAX_FINES.PER_USER_MONTHLY,
        totalLimit: FINE_CONFIG.MAX_FINES.PER_USER_TOTAL,
        perBookLimit: FINE_CONFIG.MAX_FINES.PER_BOOK
      }
    };
    
    return report;
  }
}

/**
 * 🎨 Fine Display Formatter
 * Creates attractive, user-friendly fine display messages
 */
export class FineDisplayFormatter {
  static formatFineDisplay(fineResult, options = {}) {
    const { 
      includeEmoji = true, 
      includeBreakdown = false,
      format = 'detailed' // 'simple', 'detailed', 'admin'
    } = options;

    if (!fineResult || fineResult.totalFine === 0) {
      return {
        message: includeEmoji ? '🌟 No fine - returned on time!' : 'No fine applicable',
        status: 'success',
        amount: '₹0',
        class: 'fine-success'
      };
    }

    const emoji = includeEmoji ? this._getAppropriateEmoji(fineResult.totalFine) : '';
    const amount = `₹${fineResult.totalFine.toFixed(2)}`;
    
    let message = `${emoji} Fine: ${amount}`;
    
    if (format === 'detailed' && fineResult.daysOverdue) {
      message += ` (${fineResult.daysOverdue} days overdue)`;
    }
    
    if (format === 'admin' && fineResult.exemptions?.length > 0) {
      message += ` - Exemptions: ${fineResult.exemptions.join(', ')}`;
    }

    return {
      message,
      status: this._getFineStatus(fineResult.totalFine),
      amount,
      breakdown: includeBreakdown ? fineResult.breakdown : null,
      class: this._getFineClass(fineResult.totalFine)
    };
  }

  static _getAppropriateEmoji(amount) {
    if (amount === 0) return '🌟';
    if (amount <= 10) return '💡';
    if (amount <= 50) return '⚠️';
    return '🚨';
  }

  static _getFineStatus(amount) {
    if (amount === 0) return 'success';
    if (amount <= 25) return 'warning';
    return 'error';
  }

  static _getFineClass(amount) {
    if (amount === 0) return 'fine-success';
    if (amount <= 25) return 'fine-warning';
    return 'fine-error';
  }
}

/**
 * 🎯 Fine Management Service
 */
export class FineManagementService {
  /**
   * Process fine payment
   */
  static async processPayment(userId, borrowId, amount, method = 'CASH') {
    const borrow = await Borrow.findById(borrowId);
    
    if (!borrow) {
      throw new Error('Borrow record not found');
    }
    
    if (borrow.user.toString() !== userId.toString()) {
      throw new Error('Unauthorized access to borrow record');
    }
    
    const remainingFine = Math.max(0, (borrow.fine || 0) - amount);
    
    await Borrow.findByIdAndUpdate(borrowId, {
      fine: remainingFine,
      $push: {
        payments: {
          amount,
          method,
          date: new Date(),
          processingId: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      }
    });
    
    return {
      paidAmount: amount,
      remainingFine,
      fullyPaid: remainingFine === 0,
      paymentMethod: method
    };
  }
  
  /**
   * Apply amnesty/forgiveness
   */
  static async applyAmnesty(userId, reason = 'GENERAL_AMNESTY', adminId = null) {
    const borrows = await Borrow.find({
      user: userId,
      fine: { $gt: 0 }
    });
    
    let totalForgiven = 0;
    
    for (const borrow of borrows) {
      totalForgiven += borrow.fine;
      
      await Borrow.findByIdAndUpdate(borrow._id, {
        fine: 0,
        amnesty: {
          applied: true,
          reason,
          amount: borrow.fine,
          date: new Date(),
          adminId
        }
      });
    }
    
    return {
      booksAffected: borrows.length,
      totalAmountForgiven: totalForgiven,
      reason
    };
  }
}

/**
 * 🧠 Intelligent Fine Calculator Router
 * Automatically selects the appropriate calculator based on context and requirements
 */
export class UnifiedFineManager {
  /**
   * 🎯 Smart Fine Calculation
   * Determines which calculator to use based on context and complexity requirements
   */
  static async calculateSmartFine(options = {}) {
    const {
      borrowId,
      dueDate,
      returnDate,
      userId,
      bookId,
      useAdvanced = 'auto', // 'auto', 'simple', 'advanced'
      context = 'standard' // 'standard', 'admin', 'report', 'bulk'
    } = options;

    try {
      // 🔍 Determine calculation complexity needed
      const complexityLevel = await this._determineComplexity(options);
      
      // 📊 Choose calculator based on complexity and context
      const calculatorType = this._selectCalculator(complexityLevel, useAdvanced, context);
      
      console.log(`🧮 Using ${calculatorType} calculator for ${context} context`);
      
      if (calculatorType === 'advanced') {
        return await this._executeAdvancedCalculation(options);
      } else {
        return await this._executeSimpleCalculation(options);
      }
      
    } catch (error) {
      console.error('❌ Fine calculation error:', error);
      throw new ErrorHandler(`Fine calculation failed: ${error.message}`, 500);
    }
  }

  /**
   * 🔍 Determine calculation complexity requirements
   */
  static async _determineComplexity(options) {
    const { borrowId, userId, context } = options;
    
    let complexityScore = 0;
    const factors = [];
    
    // Check if user exists and has history
    if (userId) {
      try {
        const user = await User.findById(userId);
        if (user) {
          // Admin or Faculty users need advanced calculation
          if (user.role === 'Admin' || user.role === 'Faculty') {
            complexityScore += 30;
            factors.push('special_user_role');
          }
          
          // Check borrowing history
          const borrowCount = await Borrow.countDocuments({ user: userId });
          if (borrowCount >= 5) {
            complexityScore += 20;
            factors.push('experienced_borrower');
          }
          
          // Check for existing fines
          const existingFines = await Borrow.countDocuments({ 
            user: userId, 
            fine: { $gt: 0 } 
          });
          if (existingFines > 0) {
            complexityScore += 25;
            factors.push('existing_fines');
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not assess user complexity:', error.message);
      }
    }
    
    // Context-based complexity
    if (context === 'admin' || context === 'report') {
      complexityScore += 40;
      factors.push('admin_context');
    }
    
    if (context === 'bulk') {
      complexityScore += 30;
      factors.push('bulk_operation');
    }
    
    // Weekend or holiday calculations need advanced logic
    const now = moment();
    if (HolidayManager.isWeekend(now) || HolidayManager.isHoliday(now)) {
      complexityScore += 35;
      factors.push('special_day');
    }
    
    return {
      score: complexityScore,
      factors,
      recommendation: complexityScore >= 50 ? 'advanced' : 'simple'
    };
  }

  /**
   * 🎯 Select appropriate calculator
   */
  static _selectCalculator(complexity, userPreference, context) {
    // Force advanced for admin contexts
    if (context === 'admin' || context === 'report') {
      return 'advanced';
    }
    
    // Respect user preference if specified
    if (userPreference === 'simple' || userPreference === 'advanced') {
      return userPreference;
    }
    
    // Auto-selection based on complexity
    return complexity.recommendation;
  }

  /**
   * 🚀 Execute simple calculation (fast, basic logic)
   */
  static async _executeSimpleCalculation(options) {
    const { dueDate, returnDate, borrowId } = options;
    
    const startTime = Date.now();
    
    // Use simple calculator for basic scenarios
    const result = fineCalculator(
      dueDate,
      returnDate || new Date(),
      FINE_CONFIG.RATES.STANDARD * 100, // Convert to basic calculator format
      FINE_CONFIG.GRACE_PERIODS.STANDARD,
      '₹'
    );
    
    const calculationTime = Date.now() - startTime;
    
    // Format result to match advanced calculator interface
    const formattedResult = {
      totalFine: result.fine / 100, // Convert back to decimal
      calculationType: 'simple',
      calculation: {
        fine: result.fine / 100,
        message: result.message,
        daysOverdue: this._extractDaysFromMessage(result.message),
        gracePeriod: FINE_CONFIG.GRACE_PERIODS.STANDARD,
        dailyRate: FINE_CONFIG.RATES.STANDARD
      },
      performance: {
        calculationTime: `${calculationTime}ms`,
        efficiency: 'high'
      },
      metadata: {
        timestamp: new Date().toISOString(),
        borrowId: borrowId || null
      }
    };
    
    console.log(`⚡ Simple calculation completed in ${calculationTime}ms`);
    return formattedResult;
  }

  /**
   * 🔬 Execute advanced calculation (comprehensive, business logic)
   */
  static async _executeAdvancedCalculation(options) {
    const { borrowId, dueDate, returnDate, userId } = options;
    
    const startTime = Date.now();
    
    let result;
    
    if (borrowId) {
      // Use borrow ID for complete calculation
      result = await AdvancedFineCalculator.calculateFine(borrowId);
    } else {
      // Create temporary borrow record for calculation
      const tempBorrow = await this._createTempBorrowRecord(options);
      result = await AdvancedFineCalculator.calculateFine(tempBorrow._id);
      // Clean up temporary record
      await Borrow.findByIdAndDelete(tempBorrow._id);
    }
    
    const calculationTime = Date.now() - startTime;
    
    // Enhance result with performance metrics
    result.calculationType = 'advanced';
    result.performance = {
      calculationTime: `${calculationTime}ms`,
      efficiency: calculationTime < 100 ? 'high' : calculationTime < 500 ? 'medium' : 'low'
    };
    result.metadata = {
      timestamp: new Date().toISOString(),
      borrowId: borrowId || 'temporary'
    };
    
    console.log(`🔬 Advanced calculation completed in ${calculationTime}ms`);
    return result;
  }

  /**
   * 📊 Batch Fine Calculation (optimized for bulk operations)
   */
  static async bulkCalculateFines(borrowIds, options = {}) {
    const { useParallel = true, batchSize = 10 } = options;
    
    console.log(`🔄 Starting bulk calculation for ${borrowIds.length} records`);
    const startTime = Date.now();
    
    const results = [];
    const errors = [];
    
    if (useParallel && borrowIds.length <= batchSize) {
      // Parallel processing for small batches
      const promises = borrowIds.map(async (borrowId) => {
        try {
          const result = await this.calculateSmartFine({
            borrowId,
            context: 'bulk',
            useAdvanced: 'auto'
          });
          return { borrowId, result, success: true };
        } catch (error) {
          return { borrowId, error: error.message, success: false };
        }
      });
      
      const outcomes = await Promise.allSettled(promises);
      
      outcomes.forEach((outcome) => {
        if (outcome.status === 'fulfilled') {
          if (outcome.value.success) {
            results.push(outcome.value);
          } else {
            errors.push(outcome.value);
          }
        } else {
          errors.push({ error: outcome.reason.message, success: false });
        }
      });
      
    } else {
      // Sequential processing for large batches
      for (const borrowId of borrowIds) {
        try {
          const result = await this.calculateSmartFine({
            borrowId,
            context: 'bulk',
            useAdvanced: 'simple' // Use simple for efficiency in bulk
          });
          results.push({ borrowId, result, success: true });
        } catch (error) {
          errors.push({ borrowId, error: error.message, success: false });
        }
      }
    }
    
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / borrowIds.length;
    
    console.log(`✅ Bulk calculation completed: ${results.length} successful, ${errors.length} failed`);
    
    return {
      successful: results,
      failed: errors,
      summary: {
        total: borrowIds.length,
        successCount: results.length,
        errorCount: errors.length,
        totalTime: `${totalTime}ms`,
        averageTime: `${avgTime.toFixed(2)}ms`,
        efficiency: avgTime < 50 ? 'excellent' : avgTime < 200 ? 'good' : 'needs_optimization'
      }
    };
  }

  /**
   * 📈 Fine Analytics and Insights
   */
  static async getFineAnalytics(options = {}) {
    const {
      userId,
      startDate,
      endDate = new Date(),
      includeProjections = false
    } = options;
    
    const dateFilter = {};
    if (startDate) dateFilter.borrowDate = { $gte: new Date(startDate) };
    if (endDate) dateFilter.borrowDate = { ...dateFilter.borrowDate, $lte: new Date(endDate) };
    
    const userFilter = userId ? { user: userId } : {};
    
    const query = { ...userFilter, ...dateFilter };
    
    // Aggregate fine statistics
    const stats = await Borrow.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalFines: { $sum: '$fine' },
          avgFine: { $avg: '$fine' },
          maxFine: { $max: '$fine' },
          minFine: { $min: '$fine' },
          totalBorrows: { $sum: 1 },
          paidFines: { $sum: { $cond: [{ $eq: ['$fine', 0] }, 0, '$fine'] } },
          unpaidFines: { $sum: { $cond: [{ $gt: ['$fine', 0] }, '$fine', 0] } }
        }
      }
    ]);
    
    // Calculate efficiency metrics
    const efficiencyMetrics = await this._calculateEfficiencyMetrics(query);
    
    // Generate insights
    const insights = await this._generateFineInsights(stats[0], efficiencyMetrics);
    
    const analytics = {
      period: {
        start: startDate || 'beginning',
        end: endDate,
        days: startDate ? moment(endDate).diff(moment(startDate), 'days') : 'all-time'
      },
      statistics: stats[0] || this._getEmptyStats(),
      efficiency: efficiencyMetrics,
      insights,
      calculatedAt: new Date().toISOString()
    };
    
    if (includeProjections) {
      analytics.projections = await this._generateProjections(analytics);
    }
    
    return analytics;
  }

  /**
   * 🔧 Helper Methods
   */
  static _extractDaysFromMessage(message) {
    const match = message.match(/(\d+) day\(s\) late/);
    return match ? parseInt(match[1]) : 0;
  }

  static async _createTempBorrowRecord(options) {
    const { dueDate, returnDate, userId, bookId } = options;
    
    return await Borrow.create({
      user: userId || '000000000000000000000000', // Temp user ID
      book: bookId || '000000000000000000000000', // Temp book ID
      dueDate: new Date(dueDate),
      returnDate: returnDate ? new Date(returnDate) : null,
      borrowDate: moment(dueDate).subtract(14, 'days').toDate(), // Assume 14-day loan
      fine: 0,
      _isTemporary: true
    });
  }

  static async _calculateEfficiencyMetrics(query) {
    const onTimeReturns = await Borrow.countDocuments({
      ...query,
      fine: 0,
      returnDate: { $exists: true }
    });
    
    const lateReturns = await Borrow.countDocuments({
      ...query,
      fine: { $gt: 0 }
    });
    
    const total = onTimeReturns + lateReturns;
    
    return {
      onTimeRate: total > 0 ? ((onTimeReturns / total) * 100).toFixed(2) : 0,
      lateRate: total > 0 ? ((lateReturns / total) * 100).toFixed(2) : 0,
      totalReturns: total
    };
  }

  static async _generateFineInsights(stats, efficiency) {
    const insights = [];
    
    if (stats.avgFine > FINE_CONFIG.MAX_FINES.PER_BOOK * 0.5) {
      insights.push({
        type: 'warning',
        message: 'Average fines are high - consider reviewing grace periods',
        priority: 'medium'
      });
    }
    
    if (efficiency.lateRate > 30) {
      insights.push({
        type: 'concern',
        message: 'High late return rate detected - user education may be needed',
        priority: 'high'
      });
    }
    
    if (stats.unpaidFines > FINE_CONFIG.MAX_FINES.PER_USER_TOTAL * 0.8) {
      insights.push({
        type: 'action',
        message: 'High unpaid fines - consider amnesty program',
        priority: 'high'
      });
    }
    
    return insights;
  }

  static async _generateProjections(analytics) {
    // Simple projection based on current trends
    const monthlyAvg = analytics.statistics.totalFines / Math.max(analytics.period.days / 30, 1);
    
    return {
      nextMonth: {
        estimatedFines: monthlyAvg,
        confidence: analytics.statistics.totalBorrows > 10 ? 'medium' : 'low'
      },
      recommendations: [
        'Monitor fine trends weekly',
        'Consider automated reminders',
        'Review grace period effectiveness'
      ]
    };
  }

  static _getEmptyStats() {
    return {
      totalFines: 0,
      avgFine: 0,
      maxFine: 0,
      minFine: 0,
      totalBorrows: 0,
      paidFines: 0,
      unpaidFines: 0
    };
  }
}

// ===== INTEGRATED ROUTE HANDLERS =====
// Beautiful API endpoints integrated with the fine management system

/**
 * 🎯 Fine Management API Controller
 * All endpoints in one place for better organization and maintenance
 */
export class FineAPI {
  /**
   * 🧮 Calculate fine for specific borrow record
   */
  static async calculateFine(req, res, next) {
    try {
      const { borrowId } = req.params;
      const { useAdvanced } = req.query;
      
      // Check if user can access this borrow record
      const borrow = await Borrow.findById(borrowId).populate('user');
      if (!borrow) {
        return res.status(404).json({
          success: false,
          message: "📚 Borrow record not found"
        });
      }
      
      // Authorization check
      if (req.user.role !== 'Admin' && borrow.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "🚫 Access denied to this borrow record"
        });
      }
      
      const result = await UnifiedFineManager.calculateSmartFine({
        borrowId,
        useAdvanced: useAdvanced === 'true',
        context: req.user.role === 'Admin' ? 'admin' : 'standard'
      });
      
      res.status(200).json({
        success: true,
        message: "💰 Fine calculated successfully",
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 🎯 Quick fine preview
   */
  static async getQuickFinePreview(req, res, next) {
    try {
      const { dueDate, returnDate, finePerDay = 0.50, gracePeriod = 1 } = req.query;
      
      if (!dueDate) {
        return res.status(400).json({
          success: false,
          message: "📅 Due date is required for preview"
        });
      }
      
      const result = fineCalculator(
        new Date(dueDate),
        returnDate ? new Date(returnDate) : new Date(),
        parseFloat(finePerDay) * 100, // Convert to paisa
        parseInt(gracePeriod),
        '₹'
      );
      
      res.status(200).json({
        success: true,
        message: "🔍 Fine preview generated",
        data: {
          ...result,
          preview: true,
          note: "This is a preview calculation. Actual fines may vary based on user type and policies."
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 📊 Get fine analytics
   */
  static async getFineAnalytics(req, res, next) {
    try {
      const { userId, startDate, endDate, includeProjections } = req.query;
      const targetUserId = userId || req.user._id;
      
      // Authorization check for accessing other user's data
      if (req.user.role !== 'Admin' && targetUserId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "🚫 Access denied to user analytics"
        });
      }
      
      const analytics = await UnifiedFineManager.getFineAnalytics({
        userId: targetUserId,
        startDate: startDate ? new Date(startDate) : moment().subtract(6, 'months').toDate(),
        endDate: endDate ? new Date(endDate) : new Date(),
        includeProjections: includeProjections === 'true'
      });
      
      res.status(200).json({
        success: true,
        message: "📈 Analytics generated successfully",
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 📋 Get user fine summary
   */
  static async getUserFineSummary(req, res, next) {
    try {
      const { userId } = req.params;
      
      // Use authenticated user's ID if not provided
      const targetUserId = userId || (req.user ? req.user._id.toString() : null);
      
      // Validate user ID
      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required"
        });
      }
      
      // Authorization check - users can only access their own data unless they're admin
      if (req.user.role !== 'Admin' && targetUserId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "🚫 Access denied to user summary"
        });
      }
      
      const summary = await AdvancedFineCalculator.generateUserFineReport(targetUserId);
      
      res.status(200).json({
        success: true,
        message: "📊 User summary retrieved successfully",
        data: summary
      });
    } catch (error) {
      console.error('Error in getUserFineSummary:', error);
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      if (error.message === 'Invalid user ID format') {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format"
        });
      }
      next(error);
    }
  }
  
  /**
   * 💳 Process fine payment
   */
  static async processFinePayment(req, res, next) {
    try {
      const { borrowId } = req.params;
      const { amount, method = 'CASH', reference, notes } = req.body;
      
      const borrow = await Borrow.findById(borrowId).populate('user');
      if (!borrow) {
        return res.status(404).json({
          success: false,
          message: "📚 Borrow record not found"
        });
      }
      
      // Authorization check
      if (req.user.role !== 'Admin' && borrow.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "🚫 Access denied to process this payment"
        });
      }
      
      const paymentResult = await FineManagementService.processPayment(
        req.user._id,
        borrowId,
        parseFloat(amount),
        method
      );
      
      res.status(200).json({
        success: true,
        message: paymentResult.fullyPaid ? "✅ Fine fully paid" : "💰 Partial payment processed",
        data: paymentResult
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 🔄 Bulk fine calculation (Admin only)
   */
  static async bulkCalculateFines(req, res, next) {
    try {
      const { borrowIds, updateRecords = true, useParallel = true, batchSize = 10 } = req.body;
      
      const results = await UnifiedFineManager.bulkCalculateFines(borrowIds, {
        updateRecords,
        useParallel,
        batchSize: parseInt(batchSize)
      });
      
      res.status(200).json({
        success: true,
        message: `📊 Bulk calculation completed: ${results.successful.length} successful, ${results.failed.length} failed`,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 🎁 Apply fine amnesty (Admin only)
   */
  static async applyFineAmnesty(req, res, next) {
    try {
      const { userId } = req.params;
      const { reason = 'ADMIN_AMNESTY', notes } = req.body;
      
      const result = await FineManagementService.applyAmnesty(
        userId,
        reason,
        req.user._id
      );
      
      res.status(200).json({
        success: true,
        message: `🎁 Amnesty applied: ${result.totalAmountForgiven} forgiven on ${result.booksAffected} books`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 🔄 Update all overdue fines (Admin only)
   */
  static async updateAllOverdueFines(req, res, next) {
    try {
      const results = await AdvancedFineCalculator.updateAllOverdueFines();
      
      res.status(200).json({
        success: true,
        message: `🔄 Updated ${results.updated} overdue fines`,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 🧾 Create Razorpay Order for Fine Payment
   * Endpoint to create a Razorpay order for fine payment
   */
  static async createFinePaymentOrder(req, res, next) {
    try {
      const { borrowId, amount } = req.body;

      // Validate input
      if (!borrowId || !amount || amount <= 0) {
        return next(new ErrorHandler("Borrow ID and valid amount are required", 400));
      }

      // Validate borrow record
      const borrow = await Borrow.findById(borrowId).populate('user book');
      if (!borrow) {
        return next(new ErrorHandler("Borrow record not found", 404));
      }

      // Permission check
      if (req.user.role !== 'Admin' && borrow.user._id.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Access denied. You can only pay your own fines.", 403));
      }

      // Check if there's a fine to pay
      if (!borrow.fine || borrow.fine <= 0) {
        return next(new ErrorHandler("No outstanding fine for this borrow record", 400));
      }

      // Check if payment amount is valid
      if (amount > borrow.fine) {
        return next(new ErrorHandler(`Payment amount (₹${amount.toFixed(2)}) exceeds outstanding fine (₹${borrow.fine.toFixed(2)})`, 400));
      }

      // Create Razorpay order
      const order = await createOrder(amount);

      res.status(200).json({
        success: true,
        message: "Razorpay order created successfully",
        data: {
          order,
          borrowRecord: {
            id: borrow._id,
            book: borrow.book.title,
            fine: borrow.fine
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("❌ Razorpay order creation error:", error);
      return next(new ErrorHandler("Failed to create Razorpay order", 500));
    }
  }
  
  /**
   * 📚 API Documentation
   */
  static getDocumentation(req, res) {
    res.status(200).json({
      success: true,
      message: "📚 Fine Management API Documentation",
      data: {
        version: "5.0.0",
        description: "Complete Fine Management System - All-In-One Solution",
        features: [
          "🧠 Intelligent calculator selection",
          "⚡ High-performance bulk operations",
          "💳 Comprehensive payment processing",
          "📊 Advanced analytics and insights",
          "🎁 Flexible amnesty management",
          "🔐 Role-based access control",
          "🎯 Unified API design",
          "📱 Mobile-friendly responses"
        ],
        endpoints: {
          user: {
            "GET /calculate/:borrowId": "Calculate fine for specific record",
            "GET /preview": "Quick fine preview",
            "GET /analytics": "Personal analytics",
            "GET /summary/:userId?": "User fine summary",
            "POST /pay/:borrowId": "Process payment",
            "POST /create-order": "Create Razorpay payment order"
          },
          admin: {
            "POST /admin/bulk-calculate": "Bulk fine calculation",
            "GET /admin/analytics": "System analytics",
            "POST /admin/amnesty/:userId": "Apply amnesty",
            "POST /admin/update-all": "Update all fines"
          }
        },
        performance: {
          simple_calculator: "< 5ms",
          advanced_calculator: "< 100ms",
          bulk_operations: "Parallel processing",
          analytics: "Real-time insights"
        }
      },
      timestamp: new Date().toISOString()
    });
  }
}

// ===== INTEGRATED ROUTE SETUP =====
// Beautiful, organized routes integrated with the fine management system

/**
 * 🎯 Create Fine Management Router
 * All routes configured and ready to use
 */
export const createFineRouter = () => {
  const router = express.Router();
  
  // Log when router is created
  console.log(' Fine Router initialized');
  
  // ===== ADMIN ROUTES (more specific paths first) =====
  router.get('/admin/summary/:userId',
    isAuthenticated,
    isAuthorized('Admin'),
    validateObjectId('userId'),
    adminRateLimit,
    FineAPI.getUserFineSummary
  );
  
  router.get('/admin/analytics',
    isAuthenticated,
    isAuthorized('Admin'),
    adminRateLimit,
    FineAPI.getFineAnalytics
  );
  
  router.post('/admin/bulk-calculate',
    isAuthenticated,
    isAuthorized('Admin'),
    validateBulkCalculation,
    adminRateLimit,
    FineAPI.bulkCalculateFines
  );
  
  router.post('/admin/amnesty/:userId',
    isAuthenticated,
    isAuthorized('Admin'),
    validateObjectId('userId'),
    validateAmnestyRequest,
    adminRateLimit,
    FineAPI.applyFineAmnesty
  );
  
  router.post('/admin/update-all',
    isAuthenticated,
    isAuthorized('Admin'),
    adminRateLimit,
    FineAPI.updateAllOverdueFines
  );
  
  // ===== USER ROUTES (more specific paths first) =====
  router.get('/summary/:userId?',
    isAuthenticated,
    (req, res, next) => {
      // Handle optional userId parameter properly
      const { userId } = req.params;
      
      // If userId is provided, validate it
      if (userId) {
        if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid user ID format"
          });
        }
      }
      
      // If no userId provided, use the authenticated user's ID
      if (!userId && req.user) {
        req.params.userId = req.user._id.toString();
      }
      
      next();
    },
    generalRateLimit,
    FineAPI.getUserFineSummary
  );
  
  router.get('/calculate/:borrowId', 
    isAuthenticated,
    validateObjectId('borrowId'),
    generalRateLimit,
    FineAPI.calculateFine
  );
  
  router.get('/preview',
    isAuthenticated,
    generalRateLimit,
    FineAPI.getQuickFinePreview
  );
  
  router.get('/analytics',
    isAuthenticated,
    generalRateLimit,
    FineAPI.getFineAnalytics
  );
  
  router.post('/pay/:borrowId',
    isAuthenticated,
    validateObjectId('borrowId'),
    validateFinePayment,
    generalRateLimit,
    FineAPI.processFinePayment
  );
  
  // New Razorpay order creation endpoint
  router.post('/create-order',
    isAuthenticated,
    generalRateLimit,
    FineAPI.createFinePaymentOrder
  );
  
  // ===== DOCUMENTATION =====
  router.get('/docs', isAuthenticated, FineAPI.getDocumentation);
  
  return router;
};

// Export everything for easy integration
export default AdvancedFineCalculator;