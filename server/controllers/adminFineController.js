import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { Borrow } from "../models/borrowModels.js";
import { FineAuditTrail } from "../services/paymentMonitoring.js";

/**
 * Get audit trail for a specific borrow record
 * GET /api/v1/admin/fines/audit-trail/:borrowId
 */
export const getBorrowAuditTrail = catchAsyncErrors(async (req, res, next) => {
  try {
    const { borrowId } = req.params;
    
    if (!borrowId) {
      return next(new ErrorHandler("Borrow ID is required", 400));
    }
    
    const auditTrail = await FineAuditTrail.getAuditTrail(borrowId);
    
    res.status(200).json({
      success: true,
      message: "Audit trail retrieved successfully",
      data: auditTrail
    });
  } catch (error) {
    console.error("Error fetching borrow audit trail:", error);
    return next(new ErrorHandler("Failed to retrieve audit trail", 500));
  }
});

/**
 * Get audit trail for a specific user
 * GET /api/v1/admin/fines/user-audit-trail/:userId
 */
export const getUserAuditTrail = catchAsyncErrors(async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return next(new ErrorHandler("User ID is required", 400));
    }
    
    const auditTrail = await FineAuditTrail.getUserAuditTrail(userId);
    
    res.status(200).json({
      success: true,
      message: "User audit trail retrieved successfully",
      data: auditTrail
    });
  } catch (error) {
    console.error("Error fetching user audit trail:", error);
    return next(new ErrorHandler("Failed to retrieve user audit trail", 500));
  }
});

/**
 * Manually adjust fine for a borrow record
 * POST /api/v1/admin/fines/adjust-fine/:borrowId
 */
export const adjustBorrowFine = catchAsyncErrors(async (req, res, next) => {
  try {
    const { borrowId } = req.params;
    const { newFine, reason, notes } = req.body;
    
    if (!borrowId) {
      return next(new ErrorHandler("Borrow ID is required", 400));
    }
    
    if (newFine === undefined || newFine === null) {
      return next(new ErrorHandler("New fine amount is required", 400));
    }
    
    if (!reason) {
      return next(new ErrorHandler("Reason for adjustment is required", 400));
    }
    
    // Get the borrow record
    const borrow = await Borrow.findById(borrowId);
    if (!borrow) {
      return next(new ErrorHandler("Borrow record not found", 404));
    }
    
    const oldFine = borrow.fine || 0;
    
    // Validate new fine amount
    if (newFine < 0) {
      return next(new ErrorHandler("Fine amount cannot be negative", 400));
    }
    
    // Record the adjustment in audit trail
    await FineAuditTrail.recordAdjustment(
      req.user._id,
      borrowId,
      oldFine,
      newFine,
      reason,
      notes
    );
    
    // Update the borrow record
    borrow.fine = newFine;
    borrow.lastFineUpdate = new Date();
    await borrow.save();
    
    res.status(200).json({
      success: true,
      message: "Fine adjusted successfully",
      data: {
        borrowId,
        oldFine,
        newFine,
        adjustment: newFine - oldFine
      }
    });
  } catch (error) {
    console.error("Error adjusting borrow fine:", error);
    return next(new ErrorHandler("Failed to adjust fine", 500));
  }
});