import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PaymentPopup from './PaymentPopup';

// Mock Redux store
const createMockStore = (initialState) => {
  return configureStore({
    reducer: {
      fine: (state = initialState.fine) => state,
    },
  });
};

// Mock borrow record data
const mockBorrowRecord = {
  _id: '123',
  fine: 50.00,
  name: 'John Doe',
  email: 'john@example.com',
  book: {
    title: 'Test Book',
    author: 'Test Author'
  },
  borrowDate: '2023-01-01T00:00:00.000Z',
  createdAt: '2023-01-01T00:00:00.000Z'
};

// Mock store state
const mockStoreState = {
  fine: {
    order: null,
    orderLoading: false,
    verifyLoading: false,
    error: null,
    message: null
  }
};

describe('PaymentPopup', () => {
  let store;

  beforeEach(() => {
    store = createMockStore(mockStoreState);
  });

  test('renders payment popup with correct book information', () => {
    render(
      <Provider store={store}>
        <PaymentPopup 
          borrowRecord={mockBorrowRecord} 
          onClose={jest.fn()} 
          onPaymentSuccess={jest.fn()} 
        />
      </Provider>
    );

    // Check if book title is displayed
    expect(screen.getByText('Test Book')).toBeInTheDocument();
    
    // Check if author is displayed
    expect(screen.getByText('by Test Author')).toBeInTheDocument();
    
    // Check if fine amount is displayed
    expect(screen.getByText('₹50.00')).toBeInTheDocument();
    
    // Check if borrower name is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('renders pay button with correct amount', () => {
    render(
      <Provider store={store}>
        <PaymentPopup 
          borrowRecord={mockBorrowRecord} 
          onClose={jest.fn()} 
          onPaymentSuccess={jest.fn()} 
        />
      </Provider>
    );

    const payButton = screen.getByText('Pay ₹50.00');
    expect(payButton).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const mockClose = jest.fn();
    
    render(
      <Provider store={store}>
        <PaymentPopup 
          borrowRecord={mockBorrowRecord} 
          onClose={mockClose} 
          onPaymentSuccess={jest.fn()} 
        />
      </Provider>
    );

    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  test('shows cancel button', () => {
    render(
      <Provider store={store}>
        <PaymentPopup 
          borrowRecord={mockBorrowRecord} 
          onClose={jest.fn()} 
          onPaymentSuccess={jest.fn()} 
        />
      </Provider>
    );

    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeInTheDocument();
  });
});