// 🧾 Razorpay Service
// Integration with Razorpay payment gateway for fine payments
// Secure, reliable, and production-ready payment processing

import Razorpay from 'razorpay';
import crypto from 'crypto';
import envConfig from '../config/environment.js';

/**
 * Initialize Razorpay instance with credentials from environment
 */
const razorpay = new Razorpay({
  key_id: envConfig.get('RAZORPAY_KEY_ID'),
  key_secret: envConfig.get('RAZORPAY_KEY_SECRET')
});

/**
 * Create a Razorpay order for fine payment
 * @param {number} amount - Amount in smallest currency unit (paise for INR)
 * @param {string} currency - Currency code (default: INR)
 * @param {object} options - Additional options for the order
 * @returns {Promise<object>} Razorpay order object
 */
export const createOrder = async (amount, currency = 'INR', options = {}) => {
  try {
    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Valid amount is required');
    }

    // Create order options
    const orderOptions = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      payment_capture: 1, // Auto-capture payment
      ...options
    };

    // Create the order
    const order = await razorpay.orders.create(orderOptions);
    
    console.log(`💳 Razorpay order created: ${order.id} for ₹${(order.amount/100).toFixed(2)}`);
    
    return {
      id: order.id,
      amount: order.amount / 100, // Convert back to rupees
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      created_at: order.created_at
    };
  } catch (error) {
    console.error('❌ Razorpay order creation failed:', error);
    throw new Error(`Failed to create Razorpay order: ${error.message}`);
  }
};

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Payment signature from client
 * @returns {Promise<boolean>} Whether payment is verified
 */
export const verifyPayment = async (orderId, paymentId, signature) => {
  try {
    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', envConfig.get('RAZORPAY_KEY_SECRET'))
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    // Compare signatures
    const isVerified = expectedSignature === signature;
    
    if (isVerified) {
      console.log(`✅ Razorpay payment verified: ${paymentId} for order ${orderId}`);
    } else {
      console.warn(`⚠️ Razorpay payment verification failed for ${paymentId}`);
    }
    
    return isVerified;
  } catch (error) {
    console.error('❌ Razorpay payment verification error:', error);
    throw new Error(`Payment verification failed: ${error.message}`);
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<object>} Payment details
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    if (!paymentId) {
      throw new Error('Payment ID is required');
    }

    const payment = await razorpay.payments.fetch(paymentId);
    
    return {
      id: payment.id,
      order_id: payment.order_id,
      amount: payment.amount / 100, // Convert to rupees
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      captured: payment.captured,
      created_at: payment.created_at,
      fee: payment.fee ? payment.fee / 100 : 0, // Convert to rupees
      tax: payment.tax ? payment.tax / 100 : 0, // Convert to rupees
      notes: payment.notes || {}
    };
  } catch (error) {
    console.error('❌ Razorpay payment details fetch failed:', error);
    throw new Error(`Failed to fetch payment details: ${error.message}`);
  }
};

/**
 * Capture a payment (for manual capture orders)
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to capture in smallest currency unit
 * @param {string} currency - Currency code
 * @returns {Promise<object>} Captured payment details
 */
export const capturePayment = async (paymentId, amount, currency = 'INR') => {
  try {
    if (!paymentId || !amount) {
      throw new Error('Payment ID and amount are required');
    }

    const capture = await razorpay.payments.capture(paymentId, Math.round(amount * 100), currency);
    
    console.log(`💰 Razorpay payment captured: ${paymentId} for ₹${(capture.amount/100).toFixed(2)}`);
    
    return {
      id: capture.id,
      order_id: capture.order_id,
      amount: capture.amount / 100, // Convert to rupees
      currency: capture.currency,
      status: capture.status,
      captured: capture.captured,
      captured_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Razorpay payment capture failed:', error);
    throw new Error(`Failed to capture payment: ${error.message}`);
  }
};

/**
 * Refund a payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund in smallest currency unit
 * @param {object} options - Additional refund options
 * @returns {Promise<object>} Refund details
 */
export const refundPayment = async (paymentId, amount, options = {}) => {
  try {
    if (!paymentId) {
      throw new Error('Payment ID is required');
    }

    const refundOptions = {
      payment_id: paymentId,
      ...options
    };

    if (amount) {
      refundOptions.amount = Math.round(amount * 100); // Convert to paise
    }

    const refund = await razorpay.refunds.create(refundOptions);
    
    console.log(`💸 Razorpay refund initiated: ${refund.id} for ₹${(refund.amount/100).toFixed(2)}`);
    
    return {
      id: refund.id,
      payment_id: refund.payment_id,
      amount: refund.amount / 100, // Convert to rupees
      currency: refund.currency,
      status: refund.status,
      created_at: refund.created_at,
      notes: refund.notes || {}
    };
  } catch (error) {
    console.error('❌ Razorpay refund failed:', error);
    throw new Error(`Failed to process refund: ${error.message}`);
  }
};

/**
 * Get refund details
 * @param {string} refundId - Razorpay refund ID
 * @returns {Promise<object>} Refund details
 */
export const getRefundDetails = async (refundId) => {
  try {
    if (!refundId) {
      throw new Error('Refund ID is required');
    }

    const refund = await razorpay.refunds.fetch(refundId);
    
    return {
      id: refund.id,
      payment_id: refund.payment_id,
      amount: refund.amount / 100, // Convert to rupees
      currency: refund.currency,
      status: refund.status,
      created_at: refund.created_at,
      notes: refund.notes || {}
    };
  } catch (error) {
    console.error('❌ Razorpay refund details fetch failed:', error);
    throw new Error(`Failed to fetch refund details: ${error.message}`);
  }
};

export default {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  capturePayment,
  refundPayment,
  getRefundDetails
};