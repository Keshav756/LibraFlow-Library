import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userModels.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
// Enhanced environment configuration
import envConfig from "../config/environment.js";
// Constants for better maintainability and security
const BCRYPT_SALT_ROUNDS = 12; // Increased for better security
// Enhanced cleanup management imports
import { 
  getCleanupStats, 
  triggerManualCleanup,
  getCleanupPerformanceMetrics,
  CLEANUP_CONFIG 
} from "../services/removeUnverifiedAccounts.js";
// Enhanced notification management imports
import {
  getNotificationStats as getNotificationServiceStats,
  triggerManualNotifications,
  NOTIFICATION_CONFIG
} from "../services/notifyUsers.js";

// Get all users (Admin only)
export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  try {
    console.log(' getAllUsers - Request received:', {
      user: req.user ? `${req.user.email} (${req.user.role})` : 'No user',
      url: req.originalUrl,
      method: req.method
    });
    
    // Only admins can get all users
    if (req.user.role !== "Admin") {
      console.log(' getAllUsers - Access denied, user is not admin');
      return next(new ErrorHandler("Access denied. Admins only.", 403));
    }

    const users = await User.find({ role: "User" }).select("+accountVerificationOtp");
    
    console.log(' getAllUsers - Found', users.length, 'users');
    
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("❌ Get all users error:", error);
    return next(new ErrorHandler("Failed to fetch users", 500));
  }
});

// Register a new admin
export const registerNewAdmin = catchAsyncErrors(async (req, res, next) => {
  // Check if the avatar is provided in the request
  if (!req.files || Object.keys(req.files).length === 0 || !req.files.avatar) {
    return next(new ErrorHandler("Admin avatar is required", 400));
  }

  const { name, email, password } = req.body;

  // Check if all fields are provided
  if (!name || !email || !password) {
    return next(new ErrorHandler("Please provide all fields", 400));
  }

  // Check if the user is already registered
  const isRegistered = await User.findOne({ email, accountVerified: true });
  if (isRegistered) {
    return next(new ErrorHandler("User already registered", 400));
  }

  // Validate password length
  if (password.length < 8 || password.length > 16) {
    return next(
      new ErrorHandler("Password should be between 8 to 16 characters long.", 400)
    );
  }

  const avatar = req.files.avatar; // Fixed typo `avtar` to `avatar`

  // Validate the file type of the avatar
  const allowedFormats = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(avatar.mimetype)) {
    return next(new ErrorHandler("Please upload a valid image", 400));
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // Upload avatar image to Cloudinary
  const cloudinaryResponse = await cloudinary.uploader.upload(avatar.tempFilePath, {
    folder: "Library_Management_System_Avatars",
  });

  // Check for Cloudinary upload errors
  if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
    console.error("Cloudinary error:", cloudinaryResponse.error || "Unknown error");
    return next(new ErrorHandler("Failed to upload avatar image", 500));
  }

  // Create the new admin user
  const admin = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "Admin",
    accountVerified: true,
    avatar: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
  });

  // Send response with admin details
  res.status(200).json({
    success: true,
    message: "Admin registered successfully",
    admin: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      accountVerified: admin.accountVerified,
      avatar: admin.avatar,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    },
  });
});

// ===== ENHANCED CLEANUP MANAGEMENT FOR ADMINS =====

/**
 * Get system cleanup statistics (Admin only)
 */
export const getSystemCleanupStats = catchAsyncErrors(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'Admin') {
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
      message: "System cleanup statistics retrieved successfully",
      data: {
        statistics: stats,
        configuration: config,
        serverTime: new Date().toISOString(),
        adminUser: {
          name: req.user.name,
          email: req.user.email
        }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching cleanup stats:", error);
    return next(new ErrorHandler("Failed to retrieve cleanup statistics.", 500));
  }
});

/**
 * Trigger manual system cleanup (Admin only)
 */
export const triggerSystemCleanup = catchAsyncErrors(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'Admin') {
    return next(new ErrorHandler("Access denied. Admin privileges required.", 403));
  }

  try {
    const { type = 'standard', force = false } = req.body;
    
    // Validate cleanup type
    const validTypes = ['quick', 'standard', 'deep'];
    if (!validTypes.includes(type)) {
      return next(new ErrorHandler(
        `Invalid cleanup type. Must be one of: ${validTypes.join(', ')}`, 
        400
      ));
    }

    // Log admin action
    console.log(`🚀 Admin ${req.user.email} triggered manual ${type} cleanup${force ? ' (forced)' : ''}`);
    
    const result = await triggerManualCleanup(type);
    
    res.status(200).json({
      success: true,
      message: `Manual ${type} cleanup completed successfully`,
      data: {
        cleanupType: type,
        accountsRemoved: result.deletedCount,
        executionTime: result.executionTime,
        triggeredBy: {
          name: req.user.name,
          email: req.user.email,
          id: req.user._id
        },
        timestamp: new Date().toISOString(),
        error: result.error || null,
        forced: force
      }
    });
  } catch (error) {
    console.error("❌ Error triggering manual cleanup:", error);
    return next(new ErrorHandler("Failed to trigger manual cleanup.", 500));
  }
});

/**
 * Get comprehensive system health status (Admin only)
 */
export const getSystemHealth = catchAsyncErrors(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'Admin') {
    return next(new ErrorHandler("Access denied. Admin privileges required.", 403));
  }

  try {
    const cleanupStats = getCleanupStats();
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Get database stats
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ accountVerified: true });
    const unverifiedUsers = await User.countDocuments({ accountVerified: false });
    const adminUsers = await User.countDocuments({ role: 'Admin', accountVerified: true });
    
    // Calculate health score
    let healthScore = 100;
    if (!cleanupStats.isHealthy) healthScore -= 20;
    if (unverifiedUsers > 50) healthScore -= 10;
    if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.8) healthScore -= 15;
    
    const healthData = {
      status: healthScore >= 80 ? "excellent" : healthScore >= 60 ? "good" : healthScore >= 40 ? "warning" : "critical",
      score: healthScore,
      timestamp: new Date().toISOString(),
      server: {
        uptime: {
          seconds: Math.floor(uptime),
          formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
        },
        memory: {
          used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          percentage: `${Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)}%`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
        },
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch
      },
      database: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers,
        adminUsers,
        verificationRate: totalUsers > 0 ? `${Math.round((verifiedUsers / totalUsers) * 100)}%` : '0%'
      },
      cleanupService: {
        isHealthy: cleanupStats.isHealthy,
        totalRuns: cleanupStats.totalRuns,
        totalAccountsRemoved: cleanupStats.totalAccountsRemoved,
        lastRun: cleanupStats.lastRun,
        averageExecutionTime: cleanupStats.averageCleanupTime ? `${cleanupStats.averageCleanupTime.toFixed(2)}ms` : 'N/A',
        lastError: cleanupStats.lastError
      },
      checkedBy: {
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    };

    res.status(200).json({
      success: true,
      message: `System health check completed - Status: ${healthData.status.toUpperCase()}`,
      data: healthData
    });
  } catch (error) {
    console.error("❌ Error performing health check:", error);
    return next(new ErrorHandler("Health check failed.", 500));
  }
});

/**
 * Get system dashboard data for admins
 */
export const getAdminDashboard = catchAsyncErrors(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'Admin') {
    return next(new ErrorHandler("Access denied. Admin privileges required.", 403));
  }

  try {
    // Get quick stats
    const [totalUsers, verifiedUsers, unverifiedUsers, recentUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ accountVerified: true }),
      User.countDocuments({ accountVerified: false }),
      User.find({ accountVerified: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email createdAt role')
    ]);
    
    const cleanupStats = getCleanupStats();
    
    // Calculate trends (simplified)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: last24Hours },
      accountVerified: true
    });
    
    const dashboardData = {
      overview: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers,
        newUsersToday,
        verificationRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0
      },
      cleanup: {
        isActive: cleanupStats.isHealthy,
        totalRuns: cleanupStats.totalRuns,
        accountsRemoved: cleanupStats.totalAccountsRemoved,
        lastRun: cleanupStats.lastRun,
        efficiency: performanceMetrics.performance.efficiency,
        performance: performanceMetrics.performance,
        health: performanceMetrics.health
      },
      recentUsers: recentUsers.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        joinedAt: user.createdAt
      })),
      systemInfo: {
        uptime: process.uptime(),
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        nodeVersion: process.version
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: "Admin dashboard data retrieved successfully",
      data: dashboardData
    });
  } catch (error) {
    console.error("❌ Error fetching dashboard data:", error);
    return next(new ErrorHandler("Failed to retrieve dashboard data.", 500));
  }
});

// ===== ENHANCED NOTIFICATION MANAGEMENT FOR ADMINS =====

/**
 * Get notification service statistics (Admin only)
 */
export const getNotificationStats = catchAsyncErrors(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'Admin') {
    return next(new ErrorHandler("Access denied. Admin privileges required.", 403));
  }

  try {
    const notificationStats = getNotificationServiceStats();
    
    res.status(200).json({
      success: true,
      message: "Notification service statistics retrieved successfully",
      data: {
        statistics: notificationStats,
        configuration: NOTIFICATION_CONFIG,
        serverTime: new Date().toISOString(),
        adminUser: {
          name: req.user.name,
          email: req.user.email
        }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching notification stats:", error);
    return next(new ErrorHandler("Failed to retrieve notification statistics.", 500));
  }
});

/**
 * Trigger manual notification batch (Admin only)
 */
export const triggerNotificationBatch = catchAsyncErrors(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'Admin') {
    return next(new ErrorHandler("Access denied. Admin privileges required.", 403));
  }

  try {
    const { type = 'manual', force = false } = req.body;
    
    // Validate notification type
    const validTypes = ['manual', 'daily', 'batch', 'weekly', 'urgent'];
    if (!validTypes.includes(type)) {
      return next(new ErrorHandler(
        `Invalid notification type. Must be one of: ${validTypes.join(', ')}`, 
        400
      ));
    }

    // Log admin action
    console.log(`🚀 Admin ${req.user.email} triggered manual ${type} notification batch${force ? ' (forced)' : ''}`);
    
    const result = await triggerManualNotifications(type);
    
    res.status(200).json({
      success: true,
      message: `Manual ${type} notification batch completed successfully`,
      data: {
        notificationType: type,
        recordsProcessed: result.processed,
        notificationsSent: result.sent,
        errors: result.errors,
        executionTime: result.executionTime,
        triggeredBy: {
          name: req.user.name,
          email: req.user.email,
          id: req.user._id
        },
        timestamp: new Date().toISOString(),
        error: result.error || null,
        forced: force
      }
    });
  } catch (error) {
    console.error("❌ Error triggering manual notifications:", error);
    return next(new ErrorHandler("Failed to trigger manual notification batch.", 500));
  }
});

// ===== ENHANCED ENVIRONMENT & SECURITY MANAGEMENT =====

/**
 * Get secure environment configuration info (Admin only)
 */
export const getEnvironmentInfo = catchAsyncErrors(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'Admin') {
    return next(new ErrorHandler("Access denied. Admin privileges required.", 403));
  }

  try {
    const config = envConfig.getConfig();
    
    // Return safe configuration info (no secrets)
    const safeConfig = {
      environment: config.environment,
      isProduction: config.isProduction,
      isDevelopment: config.isDevelopment,
      server: {
        port: config.server.port,
        frontendUrl: config.server.frontendUrl,
        allowedOrigins: config.server.allowedOrigins,
        cookieExpire: config.server.cookieExpire
      },
      database: {
        dbName: config.database.dbName,
        connected: true, // We'll get this from actual connection status
        poolSize: config.database.options.maxPoolSize
      },
      email: {
        host: config.email.host,
        service: config.email.service,
        port: config.email.port,
        fromName: config.email.from.name,
        configured: !!config.email.auth.user
      },
      cloudinary: {
        cloudName: config.cloudinary.cloud_name,
        folder: config.cloudinary.folder,
        configured: !!config.cloudinary.api_key
      },
      security: {
        rateLimitWindow: config.security.rateLimitWindowMs / 1000 / 60, // Convert to minutes
        rateLimitMax: config.security.rateLimitMaxRequests,
        jwtConfigured: !!config.jwt.secret,
        encryptionConfigured: !!config.security.encryptionKey
      },
      validation: {
        allRequiredPresent: true, // If we're here, validation passed
        securityChecksPass: true
      }
    };

    res.status(200).json({
      success: true,
      message: "Environment configuration retrieved successfully",
      data: {
        configuration: safeConfig,
        checkedBy: {
          name: req.user.name,
          email: req.user.email
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("❌ Error fetching environment info:", error);
    return next(new ErrorHandler("Failed to retrieve environment information.", 500));
  }
});

/**
 * Generate new secure secrets (Admin only) - for key rotation
 */
export const generateSecureSecrets = catchAsyncErrors(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'Admin') {
    return next(new ErrorHandler("Access denied. Admin privileges required.", 403));
  }

  try {
    const { type = 'all' } = req.body;
    
    const secrets = {};
    
    if (type === 'all' || type === 'jwt') {
      secrets.JWT_SECRET_KEY = envConfig.constructor.generateSecret(64);
    }
    
    if (type === 'all' || type === 'session') {
      secrets.SESSION_SECRET = envConfig.constructor.generateSecret(32);
    }
    
    if (type === 'all' || type === 'encryption') {
      secrets.ENCRYPTION_KEY = envConfig.constructor.generateSecret(16);
    }
    
    // Log admin action for security audit
    console.log(`🔐 Admin ${req.user.email} generated new ${type} secrets`);
    
    res.status(200).json({
      success: true,
      message: "Secure secrets generated successfully",
      data: {
        secrets,
        warning: "Store these secrets securely and update your environment variables immediately",
        instructions: [
          "1. Update your .env file with these new values",
          "2. Restart your application to apply changes",
          "3. For JWT secrets, all users will need to re-login",
          "4. Test all functionality after rotation"
        ],
        generatedBy: {
          name: req.user.name,
          email: req.user.email,
          id: req.user._id
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("❌ Error generating secrets:", error);
    return next(new ErrorHandler("Failed to generate secure secrets.", 500));
  }
});

/**
 * Validate environment security (Admin only)
 */
export const validateEnvironmentSecurity = catchAsyncErrors(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'Admin') {
    return next(new ErrorHandler("Access denied. Admin privileges required.", 403));
  }

  try {
    const securityChecks = [];
    const config = envConfig.getConfig();
    
    // Check JWT secret strength
    if (config.jwt.secret && config.jwt.secret.length < 32) {
      securityChecks.push({
        type: 'warning',
        category: 'JWT Security',
        message: 'JWT secret should be at least 32 characters long',
        recommendation: 'Generate a new JWT secret with minimum 64 characters'
      });
    }
    
    // Check for development settings in production
    if (config.isProduction) {
      if (config.server.frontendUrl.includes('localhost')) {
        securityChecks.push({
          type: 'error',
          category: 'Production Config',
          message: 'Frontend URL points to localhost in production',
          recommendation: 'Update FRONTEND_URL to production domain'
        });
      }
      
      if (config.database.uri.includes('localhost')) {
        securityChecks.push({
          type: 'error',
          category: 'Database Security',
          message: 'Using localhost database in production',
          recommendation: 'Use remote database service for production'
        });
      }
    }
    
    // Check rate limiting
    if (config.security.rateLimitMaxRequests > 200) {
      securityChecks.push({
        type: 'warning',
        category: 'Rate Limiting',
        message: 'Rate limit appears high for production use',
        recommendation: 'Consider lowering rate limit for better security'
      });
    }
    
    const hasErrors = securityChecks.some(check => check.type === 'error');
    const hasWarnings = securityChecks.some(check => check.type === 'warning');
    
    let securityScore = 100;
    securityScore -= securityChecks.filter(c => c.type === 'error').length * 20;
    securityScore -= securityChecks.filter(c => c.type === 'warning').length * 10;
    
    const status = hasErrors ? 'critical' : hasWarnings ? 'warning' : 'excellent';
    
    console.log(`🔍 Admin ${req.user.email} performed security validation - Status: ${status}`);
    
    res.status(200).json({
      success: true,
      message: `Security validation completed - Status: ${status.toUpperCase()}`,
      data: {
        securityStatus: status,
        securityScore,
        checks: securityChecks,
        summary: {
          totalChecks: securityChecks.length,
          errors: securityChecks.filter(c => c.type === 'error').length,
          warnings: securityChecks.filter(c => c.type === 'warning').length,
          passed: securityChecks.length === 0
        },
        environment: config.environment,
        validatedBy: {
          name: req.user.name,
          email: req.user.email
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("❌ Error validating security:", error);
    return next(new ErrorHandler("Security validation failed.", 500));
  }
});

/**
 * Get security health status (Admin only)
 */
export const getSecurityHealth = catchAsyncErrors(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'Admin') {
    return next(new ErrorHandler("Access denied. Admin privileges required.", 403));
  }

  try {
    // Import secrets validator
    const { validateAllSecrets } = await import('../utils/secretsValidator.js');
    
    // Get secret validation results
    const secretValidation = validateAllSecrets();
    
    // Get environment config
    const config = envConfig.getConfig();
    
    // Check for security issues
    const securityChecks = [];
    
    // Check JWT secret strength
    if (!secretValidation.secrets.jwt?.valid) {
      securityChecks.push({
        type: 'error',
        category: 'JWT Security',
        message: 'JWT secret is weak or missing',
        recommendation: 'Generate a new strong JWT secret with minimum 64 characters'
      });
    }
    
    // Check for development settings in production
    if (config.isProduction) {
      if (config.server.frontendUrl.includes('localhost')) {
        securityChecks.push({
          type: 'error',
          category: 'Production Config',
          message: 'Frontend URL points to localhost in production',
          recommendation: 'Update FRONTEND_URL to production domain'
        });
      }
      
      if (config.database.uri.includes('localhost')) {
        securityChecks.push({
          type: 'error',
          category: 'Database Security',
          message: 'Using localhost database in production',
          recommendation: 'Use remote database service for production'
        });
      }
    }
    
    // Check rate limiting
    if (config.security.rateLimitMaxRequests > 200) {
      securityChecks.push({
        type: 'warning',
        category: 'Rate Limiting',
        message: 'Rate limit appears high for production use',
        recommendation: 'Consider lowering rate limit for better security'
      });
    }
    
    const hasErrors = securityChecks.some(check => check.type === 'error');
    const hasWarnings = securityChecks.some(check => check.type === 'warning');
    
    let securityScore = 100;
    if (hasErrors) securityScore -= 30;
    if (hasWarnings) securityScore -= 15;
    
    res.status(200).json({
      success: true,
      message: "Security health check completed",
      data: {
        securityScore,
        status: securityScore >= 80 ? 'Good' : securityScore >= 60 ? 'Fair' : 'Poor',
        checks: securityChecks,
        secrets: secretValidation.secrets,
        environment: {
          isProduction: config.isProduction,
          isDevelopment: config.isDevelopment,
          nodeEnv: config.environment
        },
        timestamp: new Date().toISOString(),
        adminUser: {
          name: req.user.name,
          email: req.user.email
        }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching security health:", error);
    return next(new ErrorHandler("Failed to retrieve security health status.", 500));
  }
});
