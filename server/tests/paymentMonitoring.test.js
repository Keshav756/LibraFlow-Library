import { 
  recordPaymentAttempt, 
  recordPaymentSuccess, 
  recordPaymentFailure, 
  getPaymentMetrics, 
  resetMetrics 
} from '../services/paymentMonitoring.js';
import { FineAuditTrail } from '../services/paymentMonitoring.js';
import { Borrow } from '../models/borrowModels.js';

// Mock the Borrow model
jest.mock('../models/borrowModels.js');

describe('Payment Monitoring Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    resetMetrics();
  });

  describe('Payment Metrics Tracking', () => {
    it('should record payment attempts', () => {
      recordPaymentAttempt();
      const metrics = getPaymentMetrics();
      expect(metrics.totalAttempts).toBe(1);
    });

    it('should record payment successes', () => {
      recordPaymentAttempt();
      recordPaymentSuccess();
      const metrics = getPaymentMetrics();
      expect(metrics.totalSuccess).toBe(1);
      expect(metrics.successRate).toBe('100.00');
    });

    it('should record payment failures', () => {
      recordPaymentAttempt();
      recordPaymentFailure('Test failure');
      const metrics = getPaymentMetrics();
      expect(metrics.totalFailures).toBe(1);
      expect(metrics.failureRate).toBe('100.00');
      expect(metrics.failureReasons['Test failure']).toBe(1);
    });

    it('should calculate success and failure rates correctly', () => {
      // Record 3 attempts: 2 success, 1 failure
      recordPaymentAttempt();
      recordPaymentSuccess();
      
      recordPaymentAttempt();
      recordPaymentSuccess();
      
      recordPaymentAttempt();
      recordPaymentFailure('Test error');
      
      const metrics = getPaymentMetrics();
      expect(metrics.totalAttempts).toBe(3);
      expect(metrics.totalSuccess).toBe(2);
      expect(metrics.totalFailures).toBe(1);
      expect(metrics.successRate).toBe('66.67');
      expect(metrics.failureRate).toBe('33.33');
    });
  });

  describe('Fine Audit Trail', () => {
    it('should record fine adjustments', async () => {
      // Mock Borrow.findById to return a borrow record
      const mockBorrow = {
        _id: 'borrow123',
        fine: 5.00,
        fineAuditTrail: [],
        save: jest.fn()
      };
      Borrow.findById.mockResolvedValue(mockBorrow);
      
      // Record an adjustment
      const auditEntry = await FineAuditTrail.recordAdjustment(
        'admin123',
        'borrow123',
        5.00,
        0.00,
        'Admin forgiveness',
        'User complained about system downtime'
      );
      
      expect(auditEntry).toBeDefined();
      expect(auditEntry.userId).toBe('admin123');
      expect(auditEntry.oldFine).toBe(5.00);
      expect(auditEntry.newFine).toBe(0.00);
      expect(auditEntry.reason).toBe('Admin forgiveness');
      expect(mockBorrow.save).toHaveBeenCalled();
    });

    it('should handle borrow record not found', async () => {
      // Mock Borrow.findById to return null
      Borrow.findById.mockResolvedValue(null);
      
      await expect(
        FineAuditTrail.recordAdjustment(
          'admin123',
          'nonexistent123',
          5.00,
          0.00,
          'Test reason'
        )
      ).rejects.toThrow('Borrow record not found');
    });

    it('should retrieve audit trail for a borrow record', async () => {
      // Mock Borrow.findById to return a borrow record with audit trail
      const mockAuditTrail = [
        {
          timestamp: new Date(),
          userId: 'admin123',
          oldFine: 5.00,
          newFine: 0.00,
          adjustment: -5.00,
          reason: 'Admin forgiveness',
          notes: 'User complained'
        }
      ];
      
      const mockBorrow = {
        _id: 'borrow123',
        fineAuditTrail: mockAuditTrail
      };
      Borrow.findById.mockResolvedValue(mockBorrow);
      
      const auditTrail = await FineAuditTrail.getAuditTrail('borrow123');
      expect(auditTrail).toHaveLength(1);
      expect(auditTrail[0].reason).toBe('Admin forgiveness');
    });
  });
});