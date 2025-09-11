# Monitoring and Audit Trail System

## Overview

This document describes the enhanced monitoring and audit trail system implemented for the LibraFlow Library Management System. The system provides comprehensive tracking of payment processing metrics and manual fine adjustments to ensure system reliability and accountability.

## Features

### 1. Payment Monitoring
- Real-time tracking of payment processing metrics
- Automated alerting for high failure rates
- Detailed logging of payment failures with context
- Performance metrics collection

### 2. Fine Adjustment Audit Trail
- Complete history of manual fine adjustments
- Detailed records of who made changes and why
- Correlation of adjustments with borrow records
- User-level audit trail aggregation

## API Endpoints

### Payment Monitoring Endpoints

#### Get Payment Metrics
```
GET /api/v1/payments/metrics
```
Retrieves current payment processing metrics (Admin only).

Response:
```json
{
  "success": true,
  "message": "Payment metrics retrieved successfully",
  "data": {
    "totalAttempts": 42,
    "totalSuccess": 38,
    "totalFailures": 4,
    "failureReasons": {
      "Invalid input": 1,
      "Borrow record not found": 2,
      "Access denied": 1
    },
    "hourlyStats": [...],
    "successRate": "90.48",
    "failureRate": "9.52",
    "timestamp": "2023-05-15T10:30:00.000Z"
  }
}
```

### Fine Audit Trail Endpoints

#### Get Borrow Audit Trail
```
GET /api/v1/admin/fines/audit-trail/:borrowId
```
Retrieves the audit trail for a specific borrow record (Admin only).

Response:
```json
{
  "success": true,
  "message": "Audit trail retrieved successfully",
  "data": [
    {
      "timestamp": "2023-05-15T10:00:00.000Z",
      "userId": "user123",
      "oldFine": 5.00,
      "newFine": 0.00,
      "adjustment": -5.00,
      "reason": "Admin forgiveness",
      "notes": "User complained about system downtime"
    }
  ]
}
```

#### Get User Audit Trail
```
GET /api/v1/admin/fines/user-audit-trail/:userId
```
Retrieves the aggregated audit trail for a specific user (Admin only).

Response:
```json
{
  "success": true,
  "message": "User audit trail retrieved successfully",
  "data": [
    {
      "timestamp": "2023-05-15T10:00:00.000Z",
      "userId": "admin123",
      "borrowId": "borrow456",
      "oldFine": 5.00,
      "newFine": 0.00,
      "adjustment": -5.00,
      "reason": "Admin forgiveness",
      "notes": "User complained about system downtime",
      "bookId": "book789",
      "borrowDate": "2023-04-01T00:00:00.000Z"
    }
  ]
}
```

#### Adjust Borrow Fine
```
POST /api/v1/admin/fines/adjust-fine/:borrowId
```
Manually adjusts the fine for a borrow record (Admin only).

Body:
```json
{
  "newFine": 0.00,
  "reason": "Admin forgiveness",
  "notes": "User complained about system downtime"
}
```

Response:
```json
{
  "success": true,
  "message": "Fine adjusted successfully",
  "data": {
    "borrowId": "borrow123",
    "oldFine": 5.00,
    "newFine": 0.00,
    "adjustment": -5.00
  }
}
```

## Implementation Details

### Payment Monitoring Service

The payment monitoring service (`paymentMonitoring.js`) tracks key metrics:

1. **Payment Attempts**: Total number of payment initiation attempts
2. **Payment Successes**: Total number of successful payments
3. **Payment Failures**: Total number of failed payments with reasons
4. **Hourly Statistics**: Hourly breakdown of attempts, successes, and failures
5. **Failure Rate Alerts**: Automatic alerts when failure rate exceeds 10%

### Fine Audit Trail

The fine audit trail is implemented as an embedded array in the Borrow model:

```javascript
fineAuditTrail: {
  type: [
    {
      timestamp: { type: Date, default: Date.now },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      oldFine: { type: Number },
      newFine: { type: Number },
      adjustment: { type: Number },
      reason: { type: String },
      notes: { type: String }
    }
  ],
  default: []
}
```

Each manual adjustment is recorded with:
- Timestamp of the adjustment
- User ID of the administrator who made the change
- Previous fine amount
- New fine amount
- Adjustment amount (new - old)
- Reason for the adjustment
- Optional notes

## Alerting System

The system implements proactive monitoring with automatic alerts:

1. **Failure Rate Monitoring**: Checks hourly if payment failure rate exceeds 10%
2. **Automatic Alerts**: Sends alerts to administrators when thresholds are exceeded
3. **Context-Rich Logging**: All failures are logged with detailed context for troubleshooting

In production, alerts can be integrated with:
- Email notifications
- Slack/Discord webhooks
- SMS alerts
- Monitoring services (Sentry, Datadog, etc.)

## Best Practices

### For Administrators
1. Regularly review payment metrics to identify trends
2. Investigate high failure rates promptly
3. Use audit trails to track manual adjustments
4. Document reasons for all manual fine adjustments
5. Monitor user audit trails for patterns of adjustments

### For Developers
1. Always record payment attempts, successes, and failures
2. Include context information in failure logs
3. Validate all inputs for fine adjustments
4. Ensure audit trail entries are created for all manual adjustments
5. Test alerting mechanisms regularly

## Testing

### Unit Tests
- Payment metrics collection and reporting
- Audit trail recording and retrieval
- Fine adjustment validation
- Alert threshold checking

### Integration Tests
- End-to-end payment processing with metrics tracking
- Manual fine adjustment with audit trail creation
- Alert generation for high failure rates
- Admin access control for monitoring endpoints

## Security Considerations

1. **Access Control**: All monitoring and audit endpoints are restricted to Admin users
2. **Data Validation**: All inputs are validated to prevent injection attacks
3. **Audit Integrity**: Audit trail entries cannot be modified or deleted
4. **Privacy**: Audit trails only store necessary information

## Future Enhancements

1. **Advanced Analytics**: Implement predictive analytics for payment failure patterns
2. **Dashboard Integration**: Create admin dashboard for real-time monitoring
3. **Export Functionality**: Add ability to export audit trails and metrics
4. **Custom Alert Thresholds**: Allow administrators to configure alert thresholds
5. **Integration with External Monitoring**: Connect with external monitoring services