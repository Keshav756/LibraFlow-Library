import cron from 'node-cron';
import { PaymentOrder } from '../models/paymentModels.js';

/**
 * Background job to clean up abandoned payment orders
 * Runs every 30 minutes
 */
export const startPaymentCleanupJob = () => {
  console.log('🚀 Starting payment cleanup job');
  
  // Run every 30 minutes
  const job = cron.schedule('*/30 * * * *', async () => {
    try {
      console.log('🧹 Running payment order cleanup job');
      
      // Find abandoned orders (created but not attempted/paid within 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const abandonedOrders = await PaymentOrder.find({
        status: 'created',
        createdAt: { $lt: oneHourAgo }
      });
      
      if (abandonedOrders.length > 0) {
        console.log(`Found ${abandonedOrders.length} abandoned payment orders`);
        
        // Update status to abandoned
        const result = await PaymentOrder.updateMany(
          {
            status: 'created',
            createdAt: { $lt: oneHourAgo }
          },
          {
            status: 'abandoned',
            updatedAt: new Date()
          }
        );
        
        console.log(`Updated ${result.modifiedCount} payment orders to abandoned status`);
      } else {
        console.log('No abandoned payment orders found');
      }
      
      // Clean up old abandoned orders (older than 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const oldAbandonedOrders = await PaymentOrder.deleteMany({
        status: 'abandoned',
        updatedAt: { $lt: oneDayAgo }
      });
      
      if (oldAbandonedOrders.deletedCount > 0) {
        console.log(`Cleaned up ${oldAbandonedOrders.deletedCount} old abandoned payment orders`);
      }
    } catch (error) {
      console.error('❌ Error in payment cleanup job:', error);
    }
  });
  
  return job;
};

/**
 * Get payment order statistics for monitoring
 */
export const getPaymentOrderStats = async () => {
  try {
    const stats = await PaymentOrder.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const formattedStats = {};
    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
    });
    
    return formattedStats;
  } catch (error) {
    console.error('Error getting payment order stats:', error);
    return {};
  }
};