import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { reconcileBorrowPayments, reconcileAllPayments, getReconciliationStats } from "../services/paymentReconciliation.js";
import { getPaymentOrderStats } from "../jobs/paymentCleanup.js";

/**
 * Reconcile payments for a specific borrow record
 * POST /api/v1/admin/payments/reconcile-borrow/:borrowId
 */
export const reconcileBorrow = catchAsyncErrors(async (req, res, next) => {
  try {
    const { borrowId } = req.params;
    
    if (!borrowId) {
      return next(new ErrorHandler("Borrow ID is required", 400));
    }
    
    const result = await reconcileBorrowPayments(borrowId);
    
    if (!result.success) {
      return next(new ErrorHandler(result.error, 500));
    }
    
    res.status(200).json({
      success: true,
      message: "Payment reconciliation completed",
      data: result
    });
  } catch (error) {
    console.error("Error in borrow reconciliation:", error);
    return next(new ErrorHandler("Failed to reconcile borrow payments", 500));
  }
});

/**
 * Reconcile all recent payments
 * POST /api/v1/admin/payments/reconcile-all
 */
export const reconcileAll = catchAsyncErrors(async (req, res, next) => {
  try {
    const { hours } = req.body;
    const hoursToCheck = hours ? parseInt(hours) : 24;
    
    const result = await reconcileAllPayments(hoursToCheck);
    
    if (!result.success) {
      return next(new ErrorHandler(result.error, 500));
    }
    
    res.status(200).json({
      success: true,
      message: "Full payment reconciliation completed",
      data: result
    });
  } catch (error) {
    console.error("Error in full reconciliation:", error);
    return next(new ErrorHandler("Failed to reconcile all payments", 500));
  }
});

/**
 * Get payment reconciliation statistics
 * GET /api/v1/admin/payments/stats
 */
export const getPaymentStats = catchAsyncErrors(async (req, res, next) => {
  try {
    const [reconciliationStats, orderStats] = await Promise.all([
      getReconciliationStats(),
      getPaymentOrderStats()
    ]);
    
    res.status(200).json({
      success: true,
      message: "Payment statistics retrieved successfully",
      data: {
        reconciliation: reconciliationStats,
        orders: orderStats
      }
    });
  } catch (error) {
    console.error("Error getting payment stats:", error);
    return next(new ErrorHandler("Failed to retrieve payment statistics", 500));
  }
});