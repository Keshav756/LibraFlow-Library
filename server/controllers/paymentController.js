import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { Borrow } from "../models/borrowModels.js";
import { PaymentOrder } from "../models/paymentModels.js";
import { createOrder, verifyPayment } from "../utils/razorpayService.js";
import { recordPaymentAttempt, recordPaymentSuccess, recordPaymentFailure } from "../services/paymentMonitoring.js";

/**
 * Create Razorpay order for fine payment
 * POST /api/v1/payments/create-order
 */
export const createFinePaymentOrder = catchAsyncErrors(async (req, res, next) => {
  try {
    recordPaymentAttempt();
    
    const { borrowId, amount } = req.body;

    // Validate input
    if (!borrowId || !amount || amount <= 0) {
      recordPaymentFailure('Invalid input', { userId: req.user._id, borrowId, amount });
      return next(new ErrorHandler("Borrow ID and valid amount are required", 400));
    }

    // Validate borrow record
    const borrow = await Borrow.findById(borrowId).populate('user book');
    if (!borrow) {
      recordPaymentFailure('Borrow record not found', { userId: req.user._id, borrowId });
      return next(new ErrorHandler("Borrow record not found", 404));
    }

    // Permission check
    if (req.user.role !== 'Admin' && borrow.user._id.toString() !== req.user._id.toString()) {
      recordPaymentFailure('Access denied', { userId: req.user._id, borrowId });
      return next(new ErrorHandler("Access denied. You can only pay your own fines.", 403));
    }

    // Check if there's a fine to pay
    if (!borrow.fine || borrow.fine <= 0) {
      recordPaymentFailure('No outstanding fine', { userId: req.user._id, borrowId, fine: borrow.fine });
      return next(new ErrorHandler("No outstanding fine for this borrow record", 400));
    }

    // Check if payment amount is valid
    if (amount > borrow.fine) {
      recordPaymentFailure('Amount exceeds fine', { userId: req.user._id, borrowId, amount, fine: borrow.fine });
      return next(new ErrorHandler(`Payment amount (₹${amount.toFixed(2)}) exceeds outstanding fine (₹${borrow.fine.toFixed(2)})`, 400));
    }

    // Log the attempt to create an order
    console.log(`Creating Razorpay order for user ${req.user._id}, borrow ${borrowId}, amount ${amount}`);

    // Create Razorpay order
    const order = await createOrder(amount);

    // Store payment order in database for tracking
    const paymentOrder = new PaymentOrder({
      borrowId: borrow._id,
      userId: req.user._id,
      razorpayOrderId: order.id,
      amount: amount,
      currency: order.currency,
      status: 'created',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiry
    });

    await paymentOrder.save();

    recordPaymentSuccess();
    
    // Log successful order creation
    console.log(`Razorpay order created successfully: ${order.id} for user ${req.user._id}`);

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
    recordPaymentFailure('Order creation error', { 
      userId: req.user._id, 
      error: error.message,
      stack: error.stack
    });
    
    // Log error with context
    console.error("❌ Razorpay order creation error:", {
      error: error.message,
      userId: req.user._id,
      timestamp: new Date().toISOString()
    });
    return next(new ErrorHandler("Failed to create Razorpay order", 500));
  }
});

/**
 * Verify Razorpay payment
 * POST /api/v1/payments/verify-payment
 */
export const verifyRazorpayPayment = catchAsyncErrors(async (req, res, next) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, borrowId, amount } = req.body;

    // Validate input
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !borrowId || !amount) {
      recordPaymentFailure('Missing verification fields', { 
        userId: req.user._id, 
        razorpay_payment_id, 
        razorpay_order_id, 
        borrowId, 
        amount 
      });
      return next(new ErrorHandler("Missing required fields for payment verification", 400));
    }

    // Find payment order in database
    const paymentOrder = await PaymentOrder.findOne({ razorpayOrderId: razorpay_order_id });
    if (!paymentOrder) {
      recordPaymentFailure('Payment order not found', { 
        userId: req.user._id, 
        razorpay_order_id 
      });
      return next(new ErrorHandler("Payment order not found", 404));
    }

    // Validate borrow record
    const borrow = await Borrow.findById(borrowId).populate('user');
    if (!borrow) {
      recordPaymentFailure('Borrow record not found during verification', { 
        userId: req.user._id, 
        borrowId 
      });
      return next(new ErrorHandler("Borrow record not found", 404));
    }

    // Permission check
    if (req.user.role !== 'Admin' && borrow.user._id.toString() !== req.user._id.toString()) {
      recordPaymentFailure('Access denied during verification', { 
        userId: req.user._id, 
        borrowId 
      });
      return next(new ErrorHandler("Access denied. You can only verify payments for your own fines.", 403));
    }

    // Check if order is already processed
    if (paymentOrder.status === 'paid') {
      recordPaymentFailure('Payment already processed', { 
        userId: req.user._id, 
        razorpay_order_id 
      });
      return next(new ErrorHandler("Payment already processed", 400));
    }

    // Update payment order status to attempted
    paymentOrder.status = 'attempted';
    paymentOrder.updatedAt = new Date();
    await paymentOrder.save();

    // Log the verification attempt
    console.log(`Verifying Razorpay payment for user ${req.user._id}, order ${razorpay_order_id}`);

    // Verify payment signature
    const isVerified = await verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    
    if (!isVerified) {
      // Update payment order status to failed
      paymentOrder.status = 'failed';
      paymentOrder.updatedAt = new Date();
      await paymentOrder.save();
      
      recordPaymentFailure('Payment verification failed', { 
        userId: req.user._id, 
        razorpay_order_id,
        razorpay_payment_id
      });

      // Log failed verification
      console.warn(`Razorpay payment verification failed for user ${req.user._id}`, {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        timestamp: new Date().toISOString()
      });
      return next(new ErrorHandler("Payment verification failed", 400));
    }

    // Log successful verification
    console.log(`Razorpay payment verified successfully for user ${req.user._id}`, {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id
    });

    // Start transaction-like operation with rollback capability
    try {
      // Update payment order status to paid
      paymentOrder.status = 'paid';
      paymentOrder.updatedAt = new Date();
      await paymentOrder.save();

      // Update borrow record with payment details
      const paymentRecord = {
        amount: parseFloat(amount),
        method: 'RAZORPAY',
        date: new Date(),
        processingId: razorpay_payment_id,
        status: 'COMPLETED',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id
      };

      // Add payment to borrow record
      borrow.payments = borrow.payments || [];
      borrow.payments.push(paymentRecord);
      
      // Update fine amount (reduce by paid amount)
      borrow.fine = Math.max(0, borrow.fine - parseFloat(amount));
      
      // Save updated borrow record
      await borrow.save();

      recordPaymentSuccess();
      
      // Log successful DB update
      console.log(`Payment recorded successfully in DB for user ${req.user._id}`, {
        borrowId: borrow._id,
        paymentId: razorpay_payment_id,
        amount: amount,
        remainingFine: borrow.fine
      });

      res.status(200).json({
        success: true,
        message: "Payment verified and recorded successfully",
        data: {
          payment: paymentRecord,
          remainingFine: borrow.fine
        },
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      // Update payment order status to failed
      paymentOrder.status = 'failed';
      paymentOrder.updatedAt = new Date();
      await paymentOrder.save();

      recordPaymentFailure('Database update failed after verification', { 
        userId: req.user._id, 
        borrowId,
        razorpay_payment_id,
        error: dbError.message
      });
      
      // Log DB error
      console.error("❌ Database update failed after payment verification:", {
        error: dbError.message,
        userId: req.user._id,
        borrowId: borrowId,
        paymentId: razorpay_payment_id,
        timestamp: new Date().toISOString()
      });

      // In a production system, you would want to implement a reconciliation mechanism here
      // For now, we'll return an error but note that the payment was verified with Razorpay
      return next(new ErrorHandler("Payment verified with Razorpay but failed to update database. Please contact support.", 500));
    }

  } catch (error) {
    recordPaymentFailure('Payment verification error', { 
      userId: req.user._id, 
      error: error.message,
      stack: error.stack
    });
    
    // Log error with context
    console.error("❌ Razorpay payment verification error:", {
      error: error.message,
      userId: req.user._id,
      timestamp: new Date().toISOString()
    });
    return next(new ErrorHandler("Failed to verify Razorpay payment", 500));
  }
});

/**
 * Get payment order status
 * GET /api/v1/payments/order-status/:orderId
 */
export const getPaymentOrderStatus = catchAsyncErrors(async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return next(new ErrorHandler("Order ID is required", 400));
    }

    const paymentOrder = await PaymentOrder.findOne({ razorpayOrderId: orderId })
      .populate('borrowId userId');

    if (!paymentOrder) {
      return next(new ErrorHandler("Payment order not found", 404));
    }

    // Permission check
    if (req.user.role !== 'Admin' && paymentOrder.userId._id.toString() !== req.user._id.toString()) {
      return next(new ErrorHandler("Access denied.", 403));
    }

    res.status(200).json({
      success: true,
      message: "Payment order status retrieved successfully",
      data: paymentOrder
    });
  } catch (error) {
    console.error("❌ Error fetching payment order status:", error);
    return next(new ErrorHandler("Failed to fetch payment order status", 500));
  }
});

/**
 * Get payment metrics
 * GET /api/v1/payments/metrics
 */
export const getPaymentMetrics = catchAsyncErrors(async (req, res, next) => {
  try {
    // Only admins can access metrics
    if (req.user.role !== 'Admin') {
      return next(new ErrorHandler("Access denied.", 403));
    }
    
    const metrics = require('../services/paymentMonitoring.js').getPaymentMetrics();
    
    res.status(200).json({
      success: true,
      message: "Payment metrics retrieved successfully",
      data: metrics
    });
  } catch (error) {
    console.error("❌ Error fetching payment metrics:", error);
    return next(new ErrorHandler("Failed to fetch payment metrics", 500));
  }
});