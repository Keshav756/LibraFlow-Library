import { Borrow } from '../models/borrowModels.js';
import { PaymentOrder } from '../models/paymentModels.js';
import { getPaymentDetails } from '../utils/razorpayService.js';

/**
 * Payment Reconciliation Service
 * Reconciles payments between database and Razorpay
 */

/**
 * Reconcile payments for a specific borrow record
 * @param {string} borrowId - The borrow record ID
 * @returns {Promise<object>} Reconciliation result
 */
export const reconcileBorrowPayments = async (borrowId) => {
  try {
    console.log(`🔄 Starting payment reconciliation for borrow: ${borrowId}`);
    
    // Get the borrow record
    const borrow = await Borrow.findById(borrowId).populate('user');
    if (!borrow) {
      throw new Error(`Borrow record not found: ${borrowId}`);
    }
    
    // Get payment orders for this borrow
    const paymentOrders = await PaymentOrder.find({ borrowId: borrow._id });
    
    if (paymentOrders.length === 0) {
      console.log(`No payment orders found for borrow: ${borrowId}`);
      return {
        success: true,
        message: 'No payment orders to reconcile',
        borrowId,
        reconciled: 0
      };
    }
    
    let reconciledCount = 0;
    const discrepancies = [];
    
    // Check each payment order
    for (const order of paymentOrders) {
      try {
        // Skip if already reconciled or abandoned
        if (order.status === 'reconciled' || order.status === 'abandoned') {
          continue;
        }
        
        // Get payment details from Razorpay
        const paymentDetails = await getPaymentDetails(order.razorpayOrderId);
        
        // Check if payment exists in Razorpay
        if (!paymentDetails) {
          discrepancies.push({
            orderId: order.razorpayOrderId,
            issue: 'Payment not found in Razorpay',
            orderStatus: order.status
          });
          continue;
        }
        
        // Check payment status
        if (paymentDetails.status === 'captured' && order.status !== 'paid') {
          // Payment was captured in Razorpay but not marked as paid in our system
          console.log(`⚠️ Discrepancy found: Payment ${order.razorpayOrderId} captured in Razorpay but not marked as paid`);
          
          // Update our records
          order.status = 'paid';
          order.updatedAt = new Date();
          await order.save();
          
          // Update borrow record if needed
          const paymentExists = borrow.payments && borrow.payments.some(
            p => p.processingId === paymentDetails.id
          );
          
          if (!paymentExists) {
            const paymentRecord = {
              amount: paymentDetails.amount,
              method: 'RAZORPAY',
              date: new Date(paymentDetails.created_at * 1000),
              processingId: paymentDetails.id,
              status: 'COMPLETED',
              razorpayOrderId: order.razorpayOrderId,
              razorpayPaymentId: paymentDetails.id
            };
            
            borrow.payments = borrow.payments || [];
            borrow.payments.push(paymentRecord);
            
            // Update fine amount
            borrow.fine = Math.max(0, borrow.fine - paymentDetails.amount);
            
            await borrow.save();
            
            console.log(`✅ Reconciled payment ${paymentDetails.id} for borrow ${borrowId}`);
            reconciledCount++;
          }
        } else if (paymentDetails.status !== 'captured' && order.status === 'paid') {
          // Payment marked as paid in our system but not captured in Razorpay
          discrepancies.push({
            orderId: order.razorpayOrderId,
            issue: 'Payment marked as paid in system but not captured in Razorpay',
            razorpayStatus: paymentDetails.status,
            systemStatus: order.status
          });
        }
      } catch (error) {
        console.error(`Error reconciling payment order ${order.razorpayOrderId}:`, error);
        discrepancies.push({
          orderId: order.razorpayOrderId,
          issue: 'Error during reconciliation',
          error: error.message
        });
      }
    }
    
    return {
      success: true,
      message: `Reconciliation completed for borrow ${borrowId}`,
      borrowId,
      reconciled: reconciledCount,
      discrepancies,
      totalOrders: paymentOrders.length
    };
  } catch (error) {
    console.error(`Error in payment reconciliation for borrow ${borrowId}:`, error);
    return {
      success: false,
      error: error.message,
      borrowId
    };
  }
};

/**
 * Reconcile all recent payments
 * @param {number} hours - Hours to look back for reconciliation
 * @returns {Promise<object>} Reconciliation summary
 */
export const reconcileAllPayments = async (hours = 24) => {
  try {
    console.log(`🔄 Starting full payment reconciliation for last ${hours} hours`);
    
    // Find payment orders from the last N hours
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const paymentOrders = await PaymentOrder.find({
      createdAt: { $gte: since },
      status: { $in: ['paid', 'created', 'attempted'] }
    }).populate('borrowId');
    
    console.log(`Found ${paymentOrders.length} payment orders to reconcile`);
    
    const results = [];
    let totalReconciled = 0;
    const allDiscrepancies = [];
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < paymentOrders.length; i += batchSize) {
      const batch = paymentOrders.slice(i, i + batchSize);
      
      // Process batch concurrently
      const batchPromises = batch.map(order => 
        reconcileBorrowPayments(order.borrowId._id.toString())
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          totalReconciled += result.value.reconciled || 0;
          if (result.value.discrepancies) {
            allDiscrepancies.push(...result.value.discrepancies);
          }
        } else {
          console.error(`Error reconciling batch item ${index}:`, result.reason);
          allDiscrepancies.push({
            issue: 'Batch processing error',
            error: result.reason.message
          });
        }
      });
    }
    
    return {
      success: true,
      message: `Full reconciliation completed for last ${hours} hours`,
      totalProcessed: paymentOrders.length,
      totalReconciled,
      discrepancies: allDiscrepancies,
      results
    };
  } catch (error) {
    console.error('Error in full payment reconciliation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get reconciliation statistics
 * @returns {Promise<object>} Statistics about payment reconciliation
 */
export const getReconciliationStats = async () => {
  try {
    const totalOrders = await PaymentOrder.countDocuments();
    const paidOrders = await PaymentOrder.countDocuments({ status: 'paid' });
    const createdOrders = await PaymentOrder.countDocuments({ status: 'created' });
    const attemptedOrders = await PaymentOrder.countDocuments({ status: 'attempted' });
    const failedOrders = await PaymentOrder.countDocuments({ status: 'failed' });
    const abandonedOrders = await PaymentOrder.countDocuments({ status: 'abandoned' });
    
    const totalBorrowsWithPayments = await Borrow.countDocuments({
      payments: { $exists: true, $ne: [] }
    });
    
    const totalPaymentsInBorrows = await Borrow.aggregate([
      { $match: { payments: { $exists: true, $ne: [] } } },
      { $project: { paymentCount: { $size: "$payments" } } },
      { $group: { _id: null, total: { $sum: "$paymentCount" } } }
    ]);
    
    return {
      paymentOrders: {
        total: totalOrders,
        paid: paidOrders,
        created: createdOrders,
        attempted: attemptedOrders,
        failed: failedOrders,
        abandoned: abandonedOrders
      },
      borrowPayments: {
        totalBorrowsWithPayments,
        totalPayments: totalPaymentsInBorrows[0]?.total || 0
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting reconciliation stats:', error);
    return {
      error: error.message
    };
  }
};