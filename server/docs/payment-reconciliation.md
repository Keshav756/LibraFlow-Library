# Payment Reconciliation System

## Overview

The payment reconciliation system ensures consistency between the local database and Razorpay payment records. It handles scenarios where payments may be processed successfully in Razorpay but fail to update the local database, or vice versa.

## Features

### 1. Payment Order Tracking
- Tracks all payment orders in the database
- Maintains status of each order (created, attempted, paid, failed, abandoned)
- Automatically cleans up abandoned orders

### 2. Automated Reconciliation
- Reconciles payments between local database and Razorpay
- Handles discrepancies automatically
- Provides detailed reporting of reconciliation results

### 3. Background Cleanup
- Automatically marks abandoned orders (older than 1 hour)
- Cleans up old abandoned orders (older than 24 hours)
- Runs every 30 minutes

## API Endpoints

### Admin Endpoints

#### Reconcile Borrow Payments
```
POST /api/v1/admin/payments/reconcile-borrow/:borrowId
```
Reconciles all payments for a specific borrow record.

#### Reconcile All Payments
```
POST /api/v1/admin/payments/reconcile-all
```
Reconciles all recent payments (default: last 24 hours).

Body:
```json
{
  "hours": 48 // Optional: specify hours to look back
}
```

#### Get Payment Statistics
```
GET /api/v1/admin/payments/stats
```
Retrieves statistics about payment orders and reconciliation.

## How It Works

### 1. Payment Order Lifecycle
1. **Created**: Order created in database when user initiates payment
2. **Attempted**: User attempts payment in Razorpay checkout
3. **Paid**: Payment successfully captured and verified
4. **Failed**: Payment failed during processing
5. **Abandoned**: Order not completed within 1 hour
6. **Reconciled**: Discrepancy resolved during reconciliation

### 2. Reconciliation Process
1. Fetches payment orders from database
2. Retrieves corresponding payment details from Razorpay
3. Compares statuses between systems
4. Updates local records to match Razorpay when discrepancies found
5. Generates detailed report of actions taken

### 3. Discrepancy Handling
- **Payment captured in Razorpay but not marked paid locally**: Updates local records
- **Payment marked paid locally but not captured in Razorpay**: Flags for manual review
- **Missing payments**: Identifies and reports

## Error Handling

### Database Failures
- If database update fails after successful Razorpay payment, the system:
  1. Logs the error with full context
  2. Marks the payment order as failed
  3. Notifies administrators through logs
  4. Allows manual reconciliation

### Network Failures
- If communication with Razorpay fails during reconciliation:
  1. Logs the error
  2. Continues with other payments
  3. Retries failed reconciliations in next run

## Monitoring

### Logs
- All reconciliation activities are logged with timestamps
- Discrepancies are logged with full context
- Error conditions are logged with stack traces

### Metrics
- Payment order status distribution
- Reconciliation success/failure rates
- Discrepancy frequency

## Best Practices

### For Developers
1. Always check payment order status before processing
2. Handle reconciliation results in UI appropriately
3. Monitor logs for recurring discrepancies
4. Test reconciliation scenarios in development

### For Administrators
1. Regularly review payment statistics
2. Investigate recurring discrepancies
3. Run manual reconciliation after system outages
4. Monitor abandoned order rates

## Testing

### Unit Tests
- Payment order creation and status updates
- Reconciliation logic for various scenarios
- Error handling in reconciliation process

### Integration Tests
- End-to-end payment flow with reconciliation
- Database/Razorpay sync scenarios
- Background job execution

## Configuration

### Environment Variables
```env
# Razorpay credentials (already configured)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

### Cron Schedule
The cleanup job runs every 30 minutes and can be adjusted in `server/jobs/paymentCleanup.js`.

## Troubleshooting

### Common Issues

#### Payment Marked as Paid but Fine Not Reduced
1. Check payment order status in database
2. Run manual reconciliation for the borrow record
3. Verify Razorpay payment status
4. Check for errors in logs

#### Reconciliation Fails
1. Check network connectivity to Razorpay
2. Verify Razorpay credentials
3. Review error logs for specific issues
4. Retry reconciliation after addressing issues

### Manual Reconciliation
Administrators can trigger reconciliation manually through the admin API endpoints when automatic reconciliation fails or after system maintenance.