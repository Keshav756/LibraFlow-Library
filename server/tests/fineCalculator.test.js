import { AdvancedFineCalculator } from '../utils/fineCalculator.js';
import { Borrow } from '../models/borrowModels.js';
import { User } from '../models/userModels.js';

// Mock the models
jest.mock('../models/borrowModels.js');
jest.mock('../models/userModels.js');

describe('AdvancedFineCalculator', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('generateUserFineReport', () => {
    it('should calculate fines correctly for a user with overdue books', async () => {
      // Mock user data
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com'
      };

      // Mock borrow data with overdue books
      const mockBorrows = [
        {
          _id: 'borrow1',
          user: 'user123',
          book: { title: 'Test Book 1' },
          borrowDate: new Date('2023-01-01'),
          dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days overdue
          returnDate: null,
          fine: 5.00,
          fineCalculation: {}
        },
        {
          _id: 'borrow2',
          user: 'user123',
          book: { title: 'Test Book 2' },
          borrowDate: new Date('2023-01-05'),
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days overdue
          returnDate: null,
          fine: 2.50,
          fineCalculation: {}
        }
      ];

      // Mock User and Borrow model methods
      User.findById.mockResolvedValue(mockUser);
      Borrow.find.mockResolvedValue(mockBorrows);
      
      // Mock UserClassifier methods
      jest.spyOn(AdvancedFineCalculator, 'getMonthlyFines').mockResolvedValue(7.50);
      jest.spyOn(AdvancedFineCalculator, 'getTotalOutstandingFines').mockResolvedValue(7.50);

      const report = await AdvancedFineCalculator.generateUserFineReport('user123');

      expect(report).toBeDefined();
      expect(report.user).toBeDefined();
      expect(report.user.id).toBe('user123');
      expect(report.summary).toBeDefined();
      expect(report.summary.totalOutstanding).toBe(7.50);
      expect(report.summary.monthlyFines).toBe(7.50);
      expect(report.fineHistory).toHaveLength(2);
    });

    it('should handle user with no overdue books', async () => {
      // Mock user data
      const mockUser = {
        _id: 'user456',
        name: 'Test User 2',
        email: 'test2@example.com'
      };

      // Mock borrow data with no overdue books
      const mockBorrows = [
        {
          _id: 'borrow3',
          user: 'user456',
          book: { title: 'Test Book 3' },
          borrowDate: new Date('2023-01-01'),
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Due in 5 days
          returnDate: null,
          fine: 0,
          fineCalculation: {}
        }
      ];

      // Mock User and Borrow model methods
      User.findById.mockResolvedValue(mockUser);
      Borrow.find.mockResolvedValue(mockBorrows);
      
      // Mock UserClassifier methods
      jest.spyOn(AdvancedFineCalculator, 'getMonthlyFines').mockResolvedValue(0);
      jest.spyOn(AdvancedFineCalculator, 'getTotalOutstandingFines').mockResolvedValue(0);

      const report = await AdvancedFineCalculator.generateUserFineReport('user456');

      expect(report).toBeDefined();
      expect(report.user).toBeDefined();
      expect(report.user.id).toBe('user456');
      expect(report.summary.totalOutstanding).toBe(0);
      expect(report.summary.monthlyFines).toBe(0);
      expect(report.fineHistory).toHaveLength(0);
    });

    it('should throw error for invalid user ID', async () => {
      await expect(AdvancedFineCalculator.generateUserFineReport(null))
        .rejects
        .toThrow('User ID is required');

      await expect(AdvancedFineCalculator.generateUserFineReport(''))
        .rejects
        .toThrow('User ID is required');

      await expect(AdvancedFineCalculator.generateUserFineReport('invalid-id'))
        .rejects
        .toThrow('Invalid user ID format');
    });

    it('should throw error for non-existent user', async () => {
      User.findById.mockResolvedValue(null);

      await expect(AdvancedFineCalculator.generateUserFineReport('nonexistent123'))
        .rejects
        .toThrow('User not found');
    });
  });
});