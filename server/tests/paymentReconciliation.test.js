import { reconcileBorrowPayments, reconcileAllPayments } from '../services/paymentReconciliation.js';
import { Borrow } from '../models/borrowModels.js';
import { PaymentOrder } from '../models/paymentModels.js';

// Mock the models
jest.mock('../models/borrowModels.js');
jest.mock('../models/paymentModels.js');
jest.mock('../utils/razorpayService.js');

describe('Payment Reconciliation Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('reconcileBorrowPayments', () => {
    it('should handle borrow record not found', async () => {
      // Mock Borrow.findById to return null
      Borrow.findById.mockResolvedValue(null);
      
      const result = await reconcileBorrowPayments('nonexistent123');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Borrow record not found');
    });

    it('should handle borrow with no payment orders', async () => {
      // Mock Borrow.findById to return a borrow record
      const mockBorrow = {
        _id: 'borrow123',
        user: { _id: 'user123' }
      };
      Borrow.findById.mockResolvedValue(mockBorrow);
      
      // Mock PaymentOrder.find to return empty array
      PaymentOrder.find.mockResolvedValue([]);
      
      const result = await reconcileBorrowPayments('borrow123');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('No payment orders to reconcile');
    });

    it('should reconcile captured payments not marked as paid', async () => {
      // Mock Borrow.findById to return a borrow record
      const mockBorrow = {
        _id: 'borrow123',
        user: { _id: 'user123' },
        payments: [],
        fine: 10.00,
        save: jest.fn()
      };
      Borrow.findById.mockResolvedValue(mockBorrow);
      
      // Mock PaymentOrder.find to return a payment order
      const mockPaymentOrder = {
        _id: 'order123',
        borrowId: 'borrow123',
        razorpayOrderId: 'rzp_order_123',
        status: 'created',
        save: jest.fn()
      };
      PaymentOrder.find.mockResolvedValue([mockPaymentOrder]);
      
      // Mock getPaymentDetails to return captured payment
      const { getPaymentDetails } = require('../utils/razorpayService.js');
      getPaymentDetails.mockResolvedValue({
        id: 'rzp_payment_123',
        amount: 5.00,
        status: 'captured',
        created_at: Math.floor(Date.now() / 1000)
      });
      
      const result = await reconcileBorrowPayments('borrow123');
      
      expect(result.success).toBe(true);
      expect(result.reconciled).toBe(1);
      expect(mockPaymentOrder.status).toBe('paid');
      expect(mockBorrow.fine).toBe(5.00); // 10.00 - 5.00
    });
  });

  describe('reconcileAllPayments', () => {
    it('should reconcile all recent payments', async () => {
      // Mock PaymentOrder.find to return payment orders
      const mockPaymentOrders = [
        {
          _id: 'order1',
          borrowId: { _id: 'borrow1' },
          razorpayOrderId: 'rzp_order_1',
          status: 'paid'
        },
        {
          _id: 'order2',
          borrowId: { _id: 'borrow2' },
          razorpayOrderId: 'rzp_order_2',
          status: 'created'
        }
      ];
      PaymentOrder.find.mockResolvedValue(mockPaymentOrders);
      
      // Mock the reconcileBorrowPayments function
      const mockReconcileResult = {
        success: true,
        reconciled: 1,
        discrepancies: []
      };
      
      // We need to mock the actual function, not just the import
      const paymentReconciliation = require('../services/paymentReconciliation.js');
      paymentReconciliation.reconcileBorrowPayments = jest.fn().mockResolvedValue(mockReconcileResult);
      
      const result = await reconcileAllPayments(24);
      
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(2);
      expect(result.totalReconciled).toBe(2); // 1 + 1 from both calls
    });
  });
});