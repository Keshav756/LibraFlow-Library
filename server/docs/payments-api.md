# Payments API Documentation

## Overview
This API provides endpoints for processing fine payments through Razorpay integration.

## Base URL
```
https://libraflow-library-management-system.onrender.com/api/v1
```

## Authentication
All endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Create Razorpay Order
Create a Razorpay order for fine payment.

**URL**: `POST /payments/create-order`

**Request Body**:
```json
{
  "borrowId": "string",
  "amount": "number"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Razorpay order created successfully",
  "data": {
    "order": {
      "id": "string",
      "amount": "number",
      "currency": "string",
      "receipt": "string",
      "status": "string",
      "created_at": "number"
    },
    "borrowRecord": {
      "id": "string",
      "book": "string",
      "fine": "number"
    }
  },
  "timestamp": "string"
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Error message"
}
```

### Verify Razorpay Payment
Verify a Razorpay payment and update the borrow record.

**URL**: `POST /payments/verify-payment`

**Request Body**:
```json
{
  "razorpay_payment_id": "string",
  "razorpay_order_id": "string",
  "razorpay_signature": "string",
  "borrowId": "string",
  "amount": "number"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment verified and recorded successfully",
  "data": {
    "payment": {
      "amount": "number",
      "method": "string",
      "date": "string",
      "processingId": "string",
      "status": "string"
    },
    "remainingFine": "number"
  },
  "timestamp": "string"
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Error message"
}
```

## Error Codes
- `400`: Bad Request - Missing or invalid parameters
- `401`: Unauthorized - Missing or invalid authentication token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Something went wrong on the server

## Example Usage

### Create Order
```bash
curl -X POST https://libraflow-library-management-system.onrender.com/api/v1/payments/create-order \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "borrowId": "60f7b3b3e3b3a2a8c8e3b3a2",
    "amount": 50.00
  }'
```

### Verify Payment
```bash
curl -X POST https://libraflow-library-management-system.onrender.com/api/v1/payments/verify-payment \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_payment_id": "pay_JTzL8b3b3a2a8c8e3b3a2",
    "razorpay_order_id": "order_JTzL8b3b3a2a8c8e3b3a2",
    "razorpay_signature": "7d43b0a44b3b3a2a8c8e3b3a2a8c8e3b3a2a8c8e3b3a2a8c8e3b3a2a8c8e3b3a2",
    "borrowId": "60f7b3b3e3b3a2a8c8e3b3a2",
    "amount": 50.00
  }'
```