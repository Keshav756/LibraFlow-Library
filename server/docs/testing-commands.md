# Testing Commands

## Overview
This document provides curl commands for testing the LibraFlow Library Management System APIs.

## Prerequisites
1. Install curl on your system
2. Obtain a valid JWT token by logging in through the application
3. Replace placeholder values with actual data

## Authentication

### Login to get JWT token
```bash
curl -X POST https://libraflow-library-management-system.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

## Fine Management

### Calculate Fine for Borrow Record
```bash
curl -X GET https://libraflow-library-management-system.onrender.com/api/v1/fines/calculate/60f7b3b3e3b3a2a8c8e3b3a2 \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Get User Fine Summary
```bash
curl -X GET https://libraflow-library-management-system.onrender.com/api/v1/fines/summary/60f7b3b3e3b3a2a8c8e3b3a2 \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Get Fine Analytics
```bash
curl -X GET https://libraflow-library-management-system.onrender.com/api/v1/fines/analytics \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Payment Processing

### Create Razorpay Order
```bash
curl -X POST https://libraflow-library-management-system.onrender.com/api/v1/payments/create-order \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "borrowId": "60f7b3b3e3b3a2a8c8e3b3a2",
    "amount": 50.00
  }'
```

### Verify Razorpay Payment
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

## Admin Operations

### Bulk Fine Calculation
```bash
curl -X POST https://libraflow-library-management-system.onrender.com/api/v1/fines/admin/bulk-calculate \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "borrowIds": [
      "60f7b3b3e3b3a2a8c8e3b3a2",
      "60f7b3b3e3b3a2a8c8e3b3a3"
    ],
    "updateRecords": true
  }'
```

### Apply Fine Amnesty
```bash
curl -X POST https://libraflow-library-management-system.onrender.com/api/v1/fines/admin/amnesty/60f7b3b3e3b3a2a8c8e3b3a2 \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "GENERAL_AMNESTY",
    "notes": "Special amnesty program"
  }'
```

### Update All Overdue Fines
```bash
curl -X POST https://libraflow-library-management-system.onrender.com/api/v1/fines/admin/update-all \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Testing with Test Data

### Sample User Data
- User ID: `60f7b3b3e3b3a2a8c8e3b3a2`
- Email: `testuser@example.com`
- Password: `Testpass123!`

### Sample Book Data
- Book ID: `60f7b3b3e3b3a2a8c8e3b3a3`
- Title: "Sample Book for Testing"

### Sample Borrow Record
- Borrow ID: `60f7b3b3e3b3a2a8c8e3b3a4`
- Borrow Date: `2023-01-01`
- Due Date: `2023-01-15` (15 days ago for overdue testing)

## Error Testing

### Test 404 Error
```bash
curl -X GET https://libraflow-library-management-system.onrender.com/api/v1/fines/summary/invalid-user-id \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Test 401 Error (Missing Token)
```bash
curl -X GET https://libraflow-library-management-system.onrender.com/api/v1/fines/summary/60f7b3b3e3b3a2a8c8e3b3a2
```

### Test 403 Error (Insufficient Permissions)
```bash
# Try to access admin endpoint with regular user token
curl -X POST https://libraflow-library-management-system.onrender.com/api/v1/fines/admin/update-all \
  -H "Authorization: Bearer <regular-user-jwt-token>"
```

## Automated Testing Script

Create a test script `test-api.sh`:
```bash
#!/bin/bash

# Test API endpoints
echo "Testing LibraFlow API endpoints..."

# Set your JWT token here
JWT_TOKEN="your-jwt-token-here"

# Test fine calculation
echo "Testing fine calculation..."
curl -s -X GET https://libraflow-library-management-system.onrender.com/api/v1/fines/calculate/60f7b3b3e3b3a2a8c8e3b3a2 \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.'

# Test user fine summary
echo "Testing user fine summary..."
curl -s -X GET https://libraflow-library-management-system.onrender.com/api/v1/fines/summary/60f7b3b3e3b3a2a8c8e3b3a2 \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.'

echo "API tests completed."
```

Make the script executable and run it:
```bash
chmod +x test-api.sh
./test-api.sh
```