# LibraFlow Payment System Documentation

## Overview
The LibraFlow payment system integrates with Razorpay to handle library fine payments. This system allows users to pay fines for overdue books directly through the application.

## Features
- Razorpay integration for secure payment processing
- Fine calculation based on overdue days
- Payment status tracking (pending, completed, failed)
- User payment history
- Admin payment dashboard

## How It Works

### 1. Fine Calculation
When a user returns a book, the system automatically calculates any applicable fines based on:
- Due date of the book
- Actual return date
- Fine rate (configured in the system)

### 2. Payment Process
1. User views their borrowed books in the "My Borrowed Books" section
2. Books with unpaid fines show a "Pay Fine" button
3. Clicking the button opens the Payment Popup
4. User completes payment through Razorpay checkout
5. Payment is verified and status updated

### 3. Payment Verification
- All payments are verified using Razorpay's signature verification
- Payment status is updated in the database
- User payment history is maintained

## API Endpoints

### User Routes
- `POST /create-order` - Create a Razorpay order
- `POST /verify-payment` - Verify a payment
- `GET /my-payments` - Get user's payment history

### Admin Routes
- `GET /all-payments` - Get all payments (admin only)

## Components

### PaymentPopup
The main payment interface that integrates with Razorpay checkout.

### Payments
Admin dashboard to view all payments with filtering and sorting capabilities.

### UserPayments
User-specific payment history view.

### MyBorrowedBooks
Integration point where users can initiate payments for unpaid fines.

## Security
- All payments are verified using Razorpay's signature verification
- Payment IDs and statuses are securely stored
- Authentication required for all payment operations

## Configuration
The system requires the following environment variables:
- `RAZORPAY_KEY_ID` - Razorpay API key ID
- `RAZORPAY_KEY_SECRET` - Razorpay API key secret

## Error Handling
- Graceful error handling for network issues
- User-friendly error messages
- Retry mechanisms for failed payments