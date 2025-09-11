// Enhanced admin routes for system management and monitoring
import express from "express";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { 
  getCleanupStats, 
  triggerManualCleanup,
  CLEANUP_CONFIG 
} from "../services/removeUnverifiedAccounts.js";
import {
  getSecurityHealth
} from "../controllers/userControllers.js";

const router = express.Router();

/**
 * Get cleanup service statistics and health status
 * GET /api/v1/admin/cleanup/stats
 */
router.get("/cleanup/stats", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(new ErrorHandler("Access denied. Admin privileges required.", 403));
  }

  try {
    const stats = getCleanupStats();
    const config = {
      intervals: CLEANUP_CONFIG.INTERVALS,
      schedules: CLEANUP_CONFIG.SCHEDULES,
      thresholds: CLEANUP_CONFIG.THRESHOLDS
    };

    res.status(200).json({
      success: true,
      message: "Cleanup service statistics retrieved successfully",
      data: {
        statistics: stats,
        configuration: config,
        serverTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("❌ Error fetching cleanup stats:", error);
    return next(new ErrorHandler("Failed to retrieve cleanup statistics.", 500));
  }
}));

/**
 * Trigger manual cleanup
 * POST /api/v1/admin/cleanup/trigger
 * Body: { type: 'quick' | 'standard' | 'deep' }
 */
router.post("/cleanup/trigger", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(new ErrorHandler("Access denied. Admin privileges required.", 403));
  }

  try {
    const { type = 'standard' } = req.body;
    
    // Validate cleanup type
    const validTypes = ['quick', 'standard', 'deep'];
    if (!validTypes.includes(type)) {
      return next(new ErrorHandler(
        `Invalid cleanup type. Must be one of: ${validTypes.join(', ')}`, 
        400
      ));
    }

    console.log(`🚀 Admin ${req.user.email} triggered manual ${type} cleanup`);
    
    const result = await triggerManualCleanup(type);
    
    res.status(200).json({
      success: true,
      message: `Manual ${type} cleanup completed successfully`,
      data: {
        cleanupType: type,
        accountsRemoved: result.deletedCount,
        executionTime: result.executionTime,
        triggeredBy: req.user.email,
        timestamp: new Date().toISOString(),
        error: result.error || null
      }
    });
  } catch (error) {
    console.error("❌ Error triggering manual cleanup:", error);
    return next(new ErrorHandler("Failed to trigger manual cleanup.", 500));
  }
}));

/**
 * Get cleanup service configuration
 * GET /api/v1/admin/cleanup/config
 */
router.get("/cleanup/config", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(new ErrorHandler("Access denied. Admin privileges required.", 403));
  }

  try {
    res.status(200).json({
      success: true,
      message: "Cleanup service configuration retrieved successfully",
      data: {
        intervals: CLEANUP_CONFIG.INTERVALS,
        schedules: CLEANUP_CONFIG.SCHEDULES,
        thresholds: CLEANUP_CONFIG.THRESHOLDS,
        description: {
          intervals: "Time intervals in milliseconds",
          schedules: "Cron schedule patterns",
          thresholds: "Age thresholds for different cleanup types"
        }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching cleanup config:", error);
    return next(new ErrorHandler("Failed to retrieve cleanup configuration.", 500));
  }
}));

/**
 * Get security health status
 * GET /api/v1/admin/security/health
 */
router.get("/security/health", isAuthenticated, isAuthorized("Admin"), getSecurityHealth);

/**
 * System health check
 * GET /api/v1/admin/health
 */
router.get("/health", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(new ErrorHandler("Access denied. Admin privileges required.", 403));
  }

  try {
    const cleanupStats = getCleanupStats();
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      server: {
        uptime: uptime,
        memory: {
          used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
        },
        nodeVersion: process.version,
        platform: process.platform
      },
      cleanupService: {
        isHealthy: cleanupStats.isHealthy,
        totalRuns: cleanupStats.totalRuns,
        totalAccountsRemoved: cleanupStats.totalAccountsRemoved,
        lastRun: cleanupStats.lastRun,
        averageExecutionTime: cleanupStats.averageCleanupTime
      }
    };

    res.status(200).json({
      success: true,
      message: "System health check completed",
      data: healthData
    });
  } catch (error) {
    console.error("❌ Error performing health check:", error);
    return next(new ErrorHandler("Health check failed.", 500));
  }
}));

export default router;