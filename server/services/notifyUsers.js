// Enhanced intelligent notification service with smart batching and scheduling
import cron from "node-cron";
import { Borrow } from "../models/borrowModels.js";
import { sendEmail } from "../utils/sendEmail.js";
import envConfig from "../config/environment.js";

// Smart notification configuration
const NOTIFICATION_CONFIG = {
  // Schedules for different notification types (fixed to proper cron expressions)
  SCHEDULES: {
    DAILY_REMINDERS: "0 9 * * *",        // 9 AM daily
    URGENT_REMINDERS: "0 9,18 * * *",    // 9 AM and 6 PM daily
    WEEKLY_DIGEST: "0 9 * * 1",          // 9 AM every Monday
    BATCH_PROCESSING: "0 */2 * * *",     // Every 2 hours
  },
  
  // Time thresholds for different notification types (using consistent calculations)
  THRESHOLDS: {
    DUE_TODAY: 0,                         // Due today
    OVERDUE_1_DAY: 24 * 60 * 60 * 1000,  // 1 day overdue
    OVERDUE_3_DAYS: 3 * 24 * 60 * 60 * 1000, // 3 days overdue
    OVERDUE_7_DAYS: 7 * 24 * 60 * 60 * 1000, // 7 days overdue
    OVERDUE_14_DAYS: 14 * 24 * 60 * 60 * 1000, // 14 days overdue
  },
  
  // Notification limits to prevent spam
  LIMITS: {
    MAX_DAILY_NOTIFICATIONS: 2,          // Max notifications per user per day
    MAX_BATCH_SIZE: 50,                  // Max emails per batch
    COOLDOWN_PERIOD: 4 * 60 * 60 * 1000, // 4 hours between notifications
  }
};

// Notification statistics tracking
let notificationStats = {
  totalSent: 0,
  dailySent: 0,
  lastRun: null,
  lastError: null,
  batchesSent: 0,
  averageProcessingTime: 0,
  lastResetDate: new Date().toDateString()
};

/**
 * Reset daily statistics
 */
const resetDailyStats = () => {
  const today = new Date().toDateString();
  if (notificationStats.lastResetDate !== today) {
    notificationStats.dailySent = 0;
    notificationStats.lastResetDate = today;
    console.log('🔄 Daily notification stats reset');
  }
};

/**
 * Get notification priority based on overdue days
 */
const getNotificationPriority = (dueDate) => {
  const now = Date.now();
  const dueDateMs = new Date(dueDate).getTime();
  const overdueDays = Math.floor((now - dueDateMs) / (24 * 60 * 60 * 1000));
  
  if (overdueDays <= 0) return { priority: 'due_today', urgency: 'medium', days: overdueDays };
  if (overdueDays <= 1) return { priority: 'overdue_1', urgency: 'high', days: overdueDays };
  if (overdueDays <= 3) return { priority: 'overdue_3', urgency: 'high', days: overdueDays };
  if (overdueDays <= 7) return { priority: 'overdue_7', urgency: 'urgent', days: overdueDays };
  return { priority: 'overdue_14+', urgency: 'critical', days: overdueDays };
};

/**
 * Generate dynamic email content based on overdue status
 */
const generateEmailContent = (user, book, priority) => {
  const { urgency, days } = priority;
  
  // Dynamic content based on urgency
  const urgencyConfig = {
    medium: {
      emoji: '📚',
      color: '#2563eb',
      title: 'Friendly Reminder',
      tone: 'gentle reminder'
    },
    high: {
      emoji: '⏰',
      color: '#f59e0b',
      title: 'Return Reminder',
      tone: 'important reminder'
    },
    urgent: {
      emoji: '🚨',
      color: '#ef4444',
      title: 'Urgent: Book Return Required',
      tone: 'urgent notice'
    },
    critical: {
      emoji: '🛑',
      color: '#dc2626',
      title: 'Critical: Immediate Action Required',
      tone: 'critical notice'
    }
  };
  
  const config = urgencyConfig[urgency] || urgencyConfig.medium;
  const overdueText = days > 0 ? `${days} day${days > 1 ? 's' : ''} overdue` : 'due today';
  
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; max-width: 650px; margin: auto; border-radius: 12px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); color: #1e293b; border: 2px solid ${config.color}; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid ${config.color}; padding-bottom: 20px;">
        <h1 style="font-size: 28px; margin: 0; color: ${config.color}; font-weight: 700;">
          ${config.emoji} ${config.title}
        </h1>
        <p style="font-size: 14px; color: #64748b; margin: 5px 0 0 0; font-weight: 500;">
          LibraFlow Library Management System
        </p>
      </div>
      
      <!-- Greeting -->
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 22px; margin-bottom: 15px; color: #334155;">Hello ${user.name}! 👋</h2>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          This is a ${config.tone} about your borrowed book.
        </p>
      </div>
      
      <!-- Book Information Card -->
      <div style="background: white; border-radius: 10px; padding: 25px; margin: 25px 0; border-left: 5px solid ${config.color}; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h3 style="font-size: 20px; margin: 0 0 15px 0; color: ${config.color}; display: flex; align-items: center;">
          📚 Book Details
        </h3>
        <p style="font-size: 18px; margin: 10px 0; font-weight: 600; color: #1e293b;">
          <strong>Title:</strong> "${book.title}"
        </p>
        <p style="font-size: 16px; margin: 10px 0; color: #475569;">
          <strong>Author:</strong> ${book.author || 'N/A'}
        </p>
        <p style="font-size: 16px; margin: 10px 0; color: #475569;">
          <strong>Status:</strong> <span style="color: ${config.color}; font-weight: 600;">${overdueText}</span>
        </p>
      </div>
      
      <!-- Action Section -->
      <div style="text-align: center; margin: 30px 0;">
        <p style="font-size: 16px; margin-bottom: 25px; line-height: 1.6;">
          ${days > 7 ? 'Immediate action is required to avoid additional penalties.' : 
            days > 3 ? 'Please return this book promptly to avoid fines.' :
            days > 0 ? 'Please return this book at your earliest convenience.' :
            'Your book is due today. Please return it to avoid late fees.'}
        </p>
        
        <a href="${envConfig.getServerConfig().frontendUrl}/return" 
           style="display: inline-block; background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: all 0.3s ease;">
          📦 Return Book Now
        </a>
      </div>
      
      <!-- Additional Information -->
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #e2e8f0;">
        <h4 style="font-size: 16px; margin: 0 0 10px 0; color: #334155;">📝 Quick Return Options:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #475569;">
          <li style="margin: 5px 0;">Visit the library during operating hours</li>
          <li style="margin: 5px 0;">Use our 24/7 book drop-off box</li>
          <li style="margin: 5px 0;">Schedule a pickup (if available)</li>
        </ul>
      </div>
      
      <!-- Footer -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="font-size: 14px; color: #64748b; margin: 10px 0;">
          🙏 If you've already returned this book, please ignore this message.
        </p>
        <p style="font-size: 14px; color: #64748b; margin: 10px 0;">
          Thank you for being a valued member of our library community!
        </p>
        <div style="margin-top: 20px;">
          <p style="font-size: 13px; color: #94a3b8;">
            Need help? Contact us at 
            <a href="mailto:support@libraflow.com" style="color: ${config.color}; text-decoration: none;">
              support@libraflow.com
            </a>
          </p>
        </div>
      </div>
    </div>
  `;
};

/**
 * Process notifications in intelligent batches
 */
const processNotificationBatch = async (notificationType = 'daily') => {
  const startTime = Date.now();
  resetDailyStats();
  
  try {
    console.log(`🚀 Starting ${notificationType} notification batch processing...`);
    
    // Get all overdue books that haven't been notified recently
    const now = new Date();
    const cooldownTime = new Date(now.getTime() - NOTIFICATION_CONFIG.LIMITS.COOLDOWN_PERIOD);
    
    const overdueBooks = await Borrow.find({
      returnDate: null,
      dueDate: { $lt: now },
      $or: [
        { lastNotified: { $exists: false } },
        { lastNotified: { $lt: cooldownTime } },
        { notified: false }
      ]
    })
    .populate('user book')
    .sort({ dueDate: 1 }) // Oldest overdue first
    .limit(NOTIFICATION_CONFIG.LIMITS.MAX_BATCH_SIZE);
    
    if (overdueBooks.length === 0) {
      console.log('✅ No users need notifications at this time');
      return { processed: 0, sent: 0, errors: 0 };
    }
    
    console.log(`📊 Found ${overdueBooks.length} books requiring notifications`);
    
    // Group notifications by user to avoid spam
    const userNotifications = new Map();
    let processed = 0;
    let sent = 0;
    let errors = 0;
    
    // Group by user and prioritize
    for (const borrow of overdueBooks) {
      if (!borrow.user?.email || !borrow.book?.title) {
        processed++;
        continue;
      }
      
      const userId = borrow.user._id.toString();
      const priority = getNotificationPriority(borrow.dueDate);
      
      if (!userNotifications.has(userId)) {
        userNotifications.set(userId, {
          user: borrow.user,
          books: [],
          highestUrgency: priority.urgency
        });
      }
      
      const userNotif = userNotifications.get(userId);
      userNotif.books.push({ borrow, book: borrow.book, priority });
      
      // Update highest urgency
      const urgencyLevels = ['medium', 'high', 'urgent', 'critical'];
      if (urgencyLevels.indexOf(priority.urgency) > urgencyLevels.indexOf(userNotif.highestUrgency)) {
        userNotif.highestUrgency = priority.urgency;
      }
      
      processed++;
    }
    
    // Send notifications with rate limiting
    for (const [userId, notification] of userNotifications) {
      if (notificationStats.dailySent >= NOTIFICATION_CONFIG.LIMITS.MAX_DAILY_NOTIFICATIONS * userNotifications.size) {
        console.log('⚠️ Daily notification limit reached, stopping batch');
        break;
      }
      
      try {
        const { user, books } = notification;
        
        // Send individual emails for each book
        for (const { book, priority, borrow } of books) {
          const emailContent = generateEmailContent(user, book, priority);
          const subject = `${priority.urgency === 'critical' ? '🛑 URGENT: ' : '📚'} Book Return ${priority.urgency === 'critical' ? 'REQUIRED' : 'Reminder'} - "${book.title}"`;
          
          await sendEmail({
            email: user.email,
            subject,
            message: emailContent,
          });
          
          // Update notification status
          borrow.notified = true;
          borrow.lastNotified = new Date();
          await borrow.save();
          
          // Small delay between emails to avoid overwhelming the email service
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        sent++;
        notificationStats.dailySent++;
        notificationStats.totalSent++;
        
        console.log(`✅ Notification sent to ${user.email} for ${books.length} book(s)`);
        
      } catch (emailError) {
        errors++;
        console.error(`❌ Failed to send notification to ${notification.user.email}:`, emailError.message);
      }
    }
    
    const executionTime = Date.now() - startTime;
    
    // Update statistics
    notificationStats.lastRun = new Date();
    notificationStats.batchesSent++;
    notificationStats.averageProcessingTime = 
      (notificationStats.averageProcessingTime * (notificationStats.batchesSent - 1) + executionTime) / notificationStats.batchesSent;
    
    console.log(`✅ ${notificationType.toUpperCase()} notification batch completed:`);
    console.log(`   • Processed: ${processed} records`);
    console.log(`   • Sent: ${sent} notifications`);
    console.log(`   • Errors: ${errors}`);
    console.log(`   • Execution time: ${executionTime}ms`);
    
    return { processed, sent, errors, executionTime };
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    notificationStats.lastError = {
      message: error.message,
      timestamp: new Date(),
      notificationType
    };
    
    console.error(`❌ Error during ${notificationType} notification batch:`, {
      error: error.message,
      stack: error.stack,
      executionTime,
      notificationType
    });
    
    return { processed: 0, sent: 0, errors: 1, executionTime, error: error.message };
  }
};

/**
 * Enhanced notification service with multiple scheduling strategies
 */
export const notifyUsers = () => {
  console.log("🚀 Initializing enhanced notification service...");
  
  // Daily reminders at 9 AM
  const dailyJob = cron.schedule(NOTIFICATION_CONFIG.SCHEDULES.DAILY_REMINDERS, async () => {
    await processNotificationBatch('daily');
  }, {
    scheduled: false,
    timezone: "UTC"
  });
  
  // Batch processing every 2 hours for urgent cases
  const batchJob = cron.schedule(NOTIFICATION_CONFIG.SCHEDULES.BATCH_PROCESSING, async () => {
    await processNotificationBatch('batch');
  }, {
    scheduled: false,
    timezone: "UTC"
  });
  
  // Weekly digest on Mondays
  const weeklyJob = cron.schedule(NOTIFICATION_CONFIG.SCHEDULES.WEEKLY_DIGEST, async () => {
    await processNotificationBatch('weekly');
  }, {
    scheduled: false,
    timezone: "UTC"
  });
  
  // Start all jobs
  dailyJob.start();
  batchJob.start();
  weeklyJob.start();
  
  console.log("✅ Enhanced notification service initialized:");
  console.log("   • Daily reminders: 9 AM UTC");
  console.log("   • Batch processing: Every 2 hours");
  console.log("   • Weekly digest: Mondays 9 AM UTC");
  
  // Initial batch processing after startup
  setTimeout(async () => {
    console.log("🚀 Performing startup notification check...");
    await processNotificationBatch('startup');
  }, 10000); // Wait 10 seconds after startup
  
  return {
    dailyJob,
    batchJob,
    weeklyJob,
    stop: () => {
      dailyJob.stop();
      batchJob.stop();
      weeklyJob.stop();
      console.log("⚠️ All notification jobs stopped");
    },
    restart: () => {
      dailyJob.start();
      batchJob.start();
      weeklyJob.start();
      console.log("✅ All notification jobs restarted");
    },
    getStats: () => notificationStats,
    triggerManual: processNotificationBatch
  };
};

/**
 * Get notification statistics
 */
export const getNotificationStats = () => {
  return {
    ...notificationStats,
    isHealthy: !notificationStats.lastError || 
               (Date.now() - notificationStats.lastError.timestamp.getTime()) > NOTIFICATION_CONFIG.LIMITS.COOLDOWN_PERIOD,
    configuration: NOTIFICATION_CONFIG
  };
};

/**
 * Trigger manual notification batch
 */
export const triggerManualNotifications = async (type = 'manual') => {
  console.log(`🚀 Manual ${type} notification batch triggered`);
  return await processNotificationBatch(type);
};

// Export configuration for external access
export { NOTIFICATION_CONFIG };