import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Payments from './Payments';

// Mock Redux store
const createMockStore = (initialState) => {
  return configureStore({
    reducer: {
      fine: (state = initialState.fine) => state,
    },
  });
};

// Mock payment data
const mockPayments = [
  {
    _id: '1',
    razorpayPaymentId: 'pay_123',
    fine: 25.00,
    paymentStatus: 'completed',
    createdAt: '2023-01-01T00:00:00.000Z',
    user: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    book: {
      title: 'Book One',
      author: 'Author One'
    }
  },
  {
    _id: '2',
    razorpayPaymentId: 'pay_456',
    fine: 30.00,
    paymentStatus: 'completed',
    createdAt: '2023-01-02T00:00:00.000Z',
    user: {
      name: 'Jane Smith',
      email: 'jane@example.com'
    },
    book: {
      title: 'Book Two',
      author: 'Author Two'
    }
  }
];

// Mock store state
const mockStoreState = {
  fine: {
    allPayments: mockPayments,
    loading: false,
    error: null
  }
};

describe('Payments', () => {
  let store;

  beforeEach(() => {
    store = createMockStore(mockStoreState);
  });

  test('renders payment management header', () => {
    render(
      <Provider store={store}>
        <Payments />
      </Provider>
    );

    expect(screen.getByText('Payment Management')).toBeInTheDocument();
    expect(screen.getByText('Manage and track all library fine payments')).toBeInTheDocument();
  });

  test('displays payment statistics', () => {
    render(
      <Provider store={store}>
        <Payments />
      </Provider>
    );

    // Check total payments card
    expect(screen.getByText('Total Payments')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    
    // Check total amount card
    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    expect(screen.getByText('₹55.00')).toBeInTheDocument();
    
    // Check completed payments card
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('renders payment table with correct data', () => {
    render(
      <Provider store={store}>
        <Payments />
      </Provider>
    );

    // Check if payment IDs are displayed
    expect(screen.getByText('pay_123')).toBeInTheDocument();
    expect(screen.getByText('pay_456')).toBeInTheDocument();
    
    // Check if user names are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Check if book titles are displayed
    expect(screen.getByText('Book One')).toBeInTheDocument();
    expect(screen.getByText('Book Two')).toBeInTheDocument();
    
    // Check if amounts are displayed
    expect(screen.getByText('25.00')).toBeInTheDocument();
    expect(screen.getByText('30.00')).toBeInTheDocument();
  });

  test('shows correct payment status badges', () => {
    render(
      <Provider store={store}>
        <Payments />
      </Provider>
    );

    const completedBadges = screen.getAllByText('completed');
    expect(completedBadges).toHaveLength(2);
  });
});