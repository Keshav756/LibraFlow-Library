// Enhanced automated cleanup service for unverified accounts
import cron from "node-cron";
import { User } from "../models/userModels.js";

// Configuration constants for better maintainability
const CLEANUP_CONFIG = {
  // Time intervals in milliseconds (using consistent calculations)
  INTERVALS: {
    THIRTY_MINUTES: 30 * 60 * 1000,    // 30 minutes
    ONE_HOUR: 60 * 60 * 1000,          // 1 hour  
    TWENTY_FOUR_HOURS: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Cron schedules (using more precise scheduling)
  SCHEDULES: {
    EVERY_10_MINUTES: "*/10 * * * *",   // Every 10 minutes
    EVERY_30_MINUTES: "*/30 * * * *",   // Every 30 minutes
    EVERY_HOUR: "0 * * * *",            // Every hour on the hour
  },
  
  // Cleanup thresholds (using consistent time calculations)
  THRESHOLDS: {
    QUICK_CLEANUP: 30 * 60 * 1000,      // 30 minutes - for immediate cleanup
    STANDARD_CLEANUP: 2 * 60 * 60 * 1000, // 2 hours - for regular cleanup
    DEEP_CLEANUP: 24 * 60 * 60 * 1000,   // 24 hours - for thorough cleanup
  }
};

// Cleanup statistics tracking
let cleanupStats = {
  totalRuns: 0,
  totalAccountsRemoved: 0,
  lastRun: null,
  lastError: null,
  averageCleanupTime: 0
};

/**
 * Enhanced cleanup function with comprehensive logging and error handling
 * @param {number} ageThreshold - Age threshold in milliseconds
 * @param {string} cleanupType - Type of cleanup for logging
 */
const performCleanup = async (ageThreshold, cleanupType = 'standard') => {
  const startTime = Date.now();
  
  try {
    const cutoffTime = new Date(Date.now() - ageThreshold);
    const cutoffTimeISO = cutoffTime.toISOString();
    
    console.log(`🧹 Starting ${cleanupType} cleanup for accounts created before: ${cutoffTimeISO}`);
    
    // Enhanced query with additional filters for better performance
    const query = {
      accountVerified: false,
      createdAt: { $lt: cutoffTime },
      // Additional safety check to prevent accidental deletion of recent accounts
      $or: [
        { verificationCodeExpire: { $lt: new Date() } }, // Expired verification codes
        { verificationCodeExpire: { $exists: false } }    // No verification code set
      ]
    };
    
    // Get count before deletion for better metrics
    const accountsToDelete = await User.countDocuments(query);
    
    if (accountsToDelete === 0) {
      console.log(`✅ No unverified accounts found for ${cleanupType} cleanup`);
      return { deletedCount: 0, executionTime: Date.now() - startTime };
    }
    
    console.log(`📊 Found ${accountsToDelete} unverified accounts to remove`);
    
    // Perform deletion with transaction-like behavior
    const result = await User.deleteMany(query);
    
    const executionTime = Date.now() - startTime;
    
    // Update statistics
    cleanupStats.totalRuns++;
    cleanupStats.totalAccountsRemoved += result.deletedCount;
    cleanupStats.lastRun = new Date();
    cleanupStats.averageCleanupTime = 
      (cleanupStats.averageCleanupTime * (cleanupStats.totalRuns - 1) + executionTime) / cleanupStats.totalRuns;
    
    console.log(`✅ ${cleanupType.toUpperCase()} cleanup completed successfully:`);
    console.log(`   • Accounts removed: ${result.deletedCount}`);
    console.log(`   • Execution time: ${executionTime}ms`);
    console.log(`   • Cutoff time: ${cutoffTimeISO}`);
    
    // Log summary statistics every 10 runs
    if (cleanupStats.totalRuns % 10 === 0) {
      console.log(`📊 Cleanup Statistics Summary:`);
      console.log(`   • Total runs: ${cleanupStats.totalRuns}`);
      console.log(`   • Total accounts removed: ${cleanupStats.totalAccountsRemoved}`);
      console.log(`   • Average execution time: ${cleanupStats.averageCleanupTime.toFixed(2)}ms`);
      console.log(`   • Last run: ${cleanupStats.lastRun.toISOString()}`);
    }
    
    return { deletedCount: result.deletedCount, executionTime };
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    cleanupStats.lastError = {
      message: error.message,
      timestamp: new Date(),
      cleanupType
    };
    
    console.error(`❌ Error during ${cleanupType} cleanup:`, {
      error: error.message,
      stack: error.stack,
      executionTime,
      cleanupType,
      ageThreshold
    });
    
    // Don't throw error to prevent cron from stopping
    return { deletedCount: 0, executionTime, error: error.message };
  }
};

/**
 * Get cleanup statistics for monitoring
 */
export const getCleanupStats = () => {
  return {
    ...cleanupStats,
    uptime: cleanupStats.lastRun ? Date.now() - cleanupStats.lastRun.getTime() : null,
    isHealthy: !cleanupStats.lastError || 
               (Date.now() - cleanupStats.lastError.timestamp.getTime()) > CLEANUP_CONFIG.INTERVALS.ONE_HOUR
  };
};

/**
 * Manual cleanup trigger for administrative purposes
 * @param {string} type - Type of cleanup: 'quick', 'standard', or 'deep'
 */
export const triggerManualCleanup = async (type = 'standard') => {
  console.log(`🚀 Manual ${type} cleanup triggered`);
  
  switch (type) {
    case 'quick':
      return await performCleanup(CLEANUP_CONFIG.THRESHOLDS.QUICK_CLEANUP, 'quick');
    case 'deep':
      return await performCleanup(CLEANUP_CONFIG.THRESHOLDS.DEEP_CLEANUP, 'deep');
    case 'standard':
    default:
      return await performCleanup(CLEANUP_CONFIG.THRESHOLDS.STANDARD_CLEANUP, 'standard');
  }
};

/**
 * Enhanced automated cleanup service with multiple scheduling strategies
 */
export const removeUnverifiedAccounts = () => {
  console.log("🚀 Initializing enhanced unverified accounts cleanup service...");
  
  // Primary cleanup job - runs every 10 minutes for quick cleanup (30 minutes threshold)
  const primaryJob = cron.schedule(CLEANUP_CONFIG.SCHEDULES.EVERY_10_MINUTES, async () => {
    await performCleanup(CLEANUP_CONFIG.THRESHOLDS.QUICK_CLEANUP, 'quick');
  }, {
    scheduled: false, // Don't start immediately
    timezone: "UTC"   // Use UTC for consistency
  });
  
  // Standard cleanup job - runs every 30 minutes for standard cleanup (2 hours threshold)
  const standardJob = cron.schedule(CLEANUP_CONFIG.SCHEDULES.EVERY_30_MINUTES, async () => {
    await performCleanup(CLEANUP_CONFIG.THRESHOLDS.STANDARD_CLEANUP, 'standard');
  }, {
    scheduled: false,
    timezone: "UTC"
  });
  
  // Deep cleanup job - runs every hour for thorough cleanup (24 hours threshold)
  const deepJob = cron.schedule(CLEANUP_CONFIG.SCHEDULES.EVERY_HOUR, async () => {
    await performCleanup(CLEANUP_CONFIG.THRESHOLDS.DEEP_CLEANUP, 'deep');
  }, {
    scheduled: false,
    timezone: "UTC"
  });
  
  // Start all jobs
  primaryJob.start();
  standardJob.start();
  deepJob.start();
  
  console.log("✅ Cleanup service initialized with multiple strategies:");
  console.log(`   • Quick cleanup: Every 10 minutes (removes accounts older than 30 minutes)`);
  console.log(`   • Standard cleanup: Every 30 minutes (removes accounts older than 2 hours)`);
  console.log(`   • Deep cleanup: Every hour (removes accounts older than 24 hours)`);
  
  // Perform initial cleanup on startup
  setTimeout(async () => {
    console.log("🚀 Performing startup cleanup...");
    await performCleanup(CLEANUP_CONFIG.THRESHOLDS.STANDARD_CLEANUP, 'startup');
  }, 5000); // Wait 5 seconds after startup
  
  // Return job controls for potential management
  return {
    primaryJob,
    standardJob,
    deepJob,
    stop: () => {
      primaryJob.stop();
      standardJob.stop();
      deepJob.stop();
      console.log("⚠️ All cleanup jobs stopped");
    },
    restart: () => {
      primaryJob.start();
      standardJob.start();
      deepJob.start();
      console.log("✅ All cleanup jobs restarted");
    },
    getStats: getCleanupStats
  };
};

/**
 * Graceful shutdown handler
 */
export const shutdownCleanupService = (jobs) => {
  if (jobs && typeof jobs.stop === 'function') {
    jobs.stop();
    console.log("🛡️ Cleanup service shut down gracefully");
  }
};

/**
 * Get real-time cleanup performance metrics
 */
export const getCleanupPerformanceMetrics = () => {
  const now = Date.now();
  const lastRunTime = cleanupStats.lastRun ? now - cleanupStats.lastRun.getTime() : null;
  
  return {
    performance: {
      totalRuns: cleanupStats.totalRuns,
      totalAccountsRemoved: cleanupStats.totalAccountsRemoved,
      averageExecutionTime: cleanupStats.averageCleanupTime,
      efficiency: cleanupStats.totalRuns > 0 ? 
        (cleanupStats.totalAccountsRemoved / cleanupStats.totalRuns).toFixed(2) : 0,
      lastRunAgo: lastRunTime ? `${Math.floor(lastRunTime / 60000)} minutes ago` : 'Never'
    },
    health: {
      isHealthy: cleanupStats.isHealthy,
      lastError: cleanupStats.lastError,
      uptime: lastRunTime ? Math.floor(lastRunTime / 1000) : 0
    },
    configuration: {
      quickCleanupInterval: '10 minutes',
      standardCleanupInterval: '30 minutes', 
      deepCleanupInterval: '60 minutes',
      quickThreshold: '30 minutes',
      standardThreshold: '2 hours',
      deepThreshold: '24 hours'
    }
  };
};

/**
 * Reset cleanup statistics (for testing or maintenance)
 */
export const resetCleanupStats = () => {
  cleanupStats = {
    totalRuns: 0,
    totalAccountsRemoved: 0,
    lastRun: null,
    lastError: null,
    averageCleanupTime: 0
  };
  console.log('🗑️ Cleanup statistics reset');
  return true;
};

// Export configuration for external access
export { CLEANUP_CONFIG };