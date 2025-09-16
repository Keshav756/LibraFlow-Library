# Razorpay Integration Setup Guide

## Overview
This guide explains how to set up Razorpay integration for the LibraFlow library management system.

## Prerequisites
1. A Razorpay account (https://razorpay.com/)
2. API Keys from your Razorpay dashboard

## Setup Steps

### 1. Obtain Razorpay API Keys
1. Log in to your Razorpay Dashboard
2. Navigate to Settings > API Keys
3. Generate a new key or use an existing one
4. Note down the Key ID and Key Secret

### 2. Configure Server Environment Variables
Update the `server/config/config.env` file with your Razorpay credentials:

```env
# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
```

### 3. Configure Client Environment Variables (Optional)
If you want to use a different Razorpay key for the client, update the `.env` file in the client directory:

```env
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id_here
```

Note: The client uses a test key by default (`rzp_test_JTA2gns76PnMtx`) if no environment variable is set.

## Testing the Integration

### 1. Server-Side Testing
1. Ensure the server is running
2. Check the server logs for any Razorpay initialization errors
3. Test the payment endpoints:
   - `POST /api/v1/payment/create-order`
   - `POST /api/v1/payment/verify-payment`

### 2. Client-Side Testing
1. Ensure the client is running
2. Navigate to the "My Borrowed Books" section
3. Find a book with a fine and click "Pay Fine"
4. Complete the payment flow using test card details

## Test Card Details
For testing purposes, use the following test card details:

- Card Number: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: 123
- Name: Any name
- OTP: 123456

## Error Handling
The system includes comprehensive error handling for:
- Network issues
- Payment verification failures
- Invalid API keys
- Insufficient permissions

## Security Considerations
1. Never expose your Razorpay Key Secret in client-side code
2. Always verify payments on the server-side
3. Use environment variables for API keys
4. Implement proper authentication and authorization

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure the frontend URL is added to the CORS configuration
2. **Payment Verification Failures**: Check that the Key Secret matches exactly
3. **Order Creation Failures**: Verify the Razorpay Key ID is correct

### Debugging Steps
1. Check server logs for error messages
2. Verify environment variables are set correctly
3. Test API endpoints directly using tools like Postman
4. Ensure the database is properly connected

## Support
For issues with the payment integration, contact:
- Razorpay Support: https://razorpay.com/support/
- LibraFlow Development Team: [Your contact information]