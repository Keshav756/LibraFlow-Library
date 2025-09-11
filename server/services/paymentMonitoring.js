import { PaymentOrder } from '../models/paymentModels.js';
import { Borrow } from '../models/borrowModels.js';

/**
 * Payment Monitoring Service
 * Tracks payment processing metrics and alerts on failures
 */

// In-memory metrics storage (in production, use Redis or database)
const paymentMetrics = {
  totalAttempts: 0,
  totalSuccess: 0,
  totalFailures: 0,
  failureReasons: {},
  hourlyStats: []
};

// Initialize hourly stats
for (let i = 0; i < 24; i++) {
  paymentMetrics.hourlyStats.push({
    hour: i,
    attempts: 0,
    success: 0,
    failures: 0
  });
}

/**
 * Record payment attempt
 */
export const recordPaymentAttempt = () => {
  paymentMetrics.totalAttempts++;
  
  // Update hourly stats
  const currentHour = new Date().getHours();
  paymentMetrics.hourlyStats[currentHour].attempts++;
};

/**
 * Record payment success
 */
export const recordPaymentSuccess = () => {
  paymentMetrics.totalSuccess++;
  
  // Update hourly stats
  const currentHour = new Date().getHours();
  paymentMetrics.hourlyStats[currentHour].success++;
};

/**
 * Record payment failure
 * @param {string} reason - Reason for failure
 * @param {object} context - Additional context (user ID, borrow ID, etc.)
 */
export const recordPaymentFailure = (reason, context = {}) => {
  paymentMetrics.totalFailures++;
  
  // Update failure reasons
  if (!paymentMetrics.failureReasons[reason]) {
    paymentMetrics.failureReasons[reason] = 0;
  }
  paymentMetrics.failureReasons[reason]++;
  
  // Update hourly stats
  const currentHour = new Date().getHours();
  paymentMetrics.hourlyStats[currentHour].failures++;
  
  // Log the failure with context
  console.error('💳 Payment Failure:', {
    reason,
    context,
    timestamp: new Date().toISOString()
  });
  
  // Check if we should send an alert (e.g., failure rate > 10% in last hour)
  checkFailureRateAlert();
};

/**
 * Check if failure rate exceeds threshold and send alert
 */
const checkFailureRateAlert = () => {
  const currentHour = new Date().getHours();
  const stats = paymentMetrics.hourlyStats[currentHour];
  
  if (stats.attempts > 0) {
    const failureRate = stats.failures / stats.attempts;
    if (failureRate > 0.1) { // 10% threshold
      sendAlert(`High payment failure rate: ${(failureRate * 100).toFixed(2)}% in the last hour`);
    }
  }
};

/**
 * Send alert (in production, integrate with monitoring service like Sentry, PagerDuty, etc.)
 * @param {string} message - Alert message
 */
const sendAlert = (message) => {
  console.warn('🚨 Payment Monitoring Alert:', message);
  
  // In a real implementation, you would integrate with:
  // - Email notifications
  // - Slack/Discord webhooks
  // - SMS alerts
  // - Monitoring services (Sentry, Datadog, etc.)
};

/**
 * Get payment metrics
 * @returns {object} Current payment metrics
 */
export const getPaymentMetrics = () => {
  const total = paymentMetrics.totalAttempts;
  const successRate = total > 0 ? (paymentMetrics.totalSuccess / total) * 100 : 0;
  const failureRate = total > 0 ? (paymentMetrics.totalFailures / total) * 100 : 0;
  
  return {
    ...paymentMetrics,
    successRate: successRate.toFixed(2),
    failureRate: failureRate.toFixed(2),
    timestamp: new Date().toISOString()
  };
};

/**
 * Reset metrics (for testing purposes)
 */
export const resetMetrics = () => {
  paymentMetrics.totalAttempts = 0;
  paymentMetrics.totalSuccess = 0;
  paymentMetrics.totalFailures = 0;
  paymentMetrics.failureReasons = {};
  
  for (let i = 0; i < 24; i++) {
    paymentMetrics.hourlyStats[i].attempts = 0;
    paymentMetrics.hourlyStats[i].success = 0;
    paymentMetrics.hourlyStats[i].failures = 0;
  }
};

/**
 * Audit trail for manual fine adjustments
 */
export class FineAuditTrail {
  /**
   * Record a manual fine adjustment
   * @param {string} userId - User ID of the person making the adjustment
   * @param {string} borrowId - Borrow record ID
   * @param {number} oldFine - Previous fine amount
   * @param {number} newFine - New fine amount
   * @param {string} reason - Reason for adjustment
   * @param {string} notes - Additional notes
   */
  static async recordAdjustment(userId, borrowId, oldFine, newFine, reason, notes = '') {
    try {
      // Get the borrow record
      const borrow = await Borrow.findById(borrowId);
      if (!borrow) {
        throw new Error('Borrow record not found');
      }
      
      // Create audit entry
      const auditEntry = {
        timestamp: new Date(),
        userId,
        borrowId,
        oldFine,
        newFine,
        adjustment: newFine - oldFine,
        reason,
        notes
      };
      
      // Add to borrow record's audit trail
      if (!borrow.fineAuditTrail) {
        borrow.fineAuditTrail = [];
      }
      borrow.fineAuditTrail.push(auditEntry);
      
      // Save the borrow record
      await borrow.save();
      
      console.log('📝 Fine adjustment recorded in audit trail:', auditEntry);
      
      return auditEntry;
    } catch (error) {
      console.error('❌ Error recording fine adjustment:', error);
      throw error;
    }
  }
  
  /**
   * Get audit trail for a borrow record
   * @param {string} borrowId - Borrow record ID
   * @returns {Array} Audit trail entries
   */
  static async getAuditTrail(borrowId) {
    try {
      const borrow = await Borrow.findById(borrowId);
      if (!borrow) {
        throw new Error('Borrow record not found');
      }
      
      return borrow.fineAuditTrail || [];
    } catch (error) {
      console.error('❌ Error fetching audit trail:', error);
      throw error;
    }
  }
  
  /**
   * Get audit trail for a user
   * @param {string} userId - User ID
   * @returns {Array} All audit trail entries for the user
   */
  static async getUserAuditTrail(userId) {
    try {
      const borrows = await Borrow.find({ user: userId });
      const allAuditEntries = [];
      
      borrows.forEach(borrow => {
        if (borrow.fineAuditTrail && borrow.fineAuditTrail.length > 0) {
          borrow.fineAuditTrail.forEach(entry => {
            allAuditEntries.push({
              ...entry,
              bookId: borrow.book,
              borrowDate: borrow.borrowDate
            });
          });
        }
      });
      
      // Sort by timestamp descending
      allAuditEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return allAuditEntries;
    } catch (error) {
      console.error('❌ Error fetching user audit trail:', error);
      throw error;
    }
  }
}