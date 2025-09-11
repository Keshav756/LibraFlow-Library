import { catchAsyncErrors } from "./catchAsyncErrors.js";
import jwt from "jsonwebtoken";
import ErrorHandler from "./errorMiddlewares.js";
import { User } from "../models/userModels.js";
import envConfig from "../config/environment.js";
import crypto from "crypto";

/**
 * Generate device fingerprint for security validation
 */
const generateDeviceFingerprint = (req) => {
  const userAgent = req?.get('User-Agent') || 'unknown';
  const acceptLanguage = req?.get('Accept-Language') || 'unknown';
  const acceptEncoding = req?.get('Accept-Encoding') || 'unknown';
  const ip = req?.ip || req?.connection?.remoteAddress || 'unknown';
  
  const fingerprint = `${userAgent}-${acceptLanguage}-${acceptEncoding}-${ip}`;
  return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 16);
};

/**
 * Enhanced authentication middleware with advanced security features
 */
export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  try {
    console.log(' Auth middleware - Checking authentication for:', req.originalUrl);
    const { token } = req.cookies;
    
    console.log(' Auth middleware - Token in cookies:', token ? 'Present' : 'Missing');
    
    // Also check for Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    console.log(' Auth middleware - Authorization header:', authHeader);
    
    if (!token && !authHeader) {
      console.log(' Auth middleware - No authentication provided');
      return next(new ErrorHandler("Authentication required. Please login to continue.", 401));
    }
    
    let decoded;
    const jwtConfig = envConfig.getJWTConfig();
    
    // Try to decode token from cookie first
    if (token) {
      try {
        decoded = jwt.verify(token, jwtConfig.secret, {
          issuer: jwtConfig.issuer,
          audience: jwtConfig.audience,
          algorithms: ['HS256']
        });
        console.log(' Auth middleware - Token verified from cookie');
      } catch (err) {
        console.log(' Auth middleware - Cookie token verification failed:', err.message);
      }
    }
    
    // If cookie token failed, try Authorization header
    if (!decoded && authHeader) {
      try {
        const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        decoded = jwt.verify(tokenFromHeader, jwtConfig.secret, {
          issuer: jwtConfig.issuer,
          audience: jwtConfig.audience,
          algorithms: ['HS256']
        });
        console.log(' Auth middleware - Token verified from Authorization header');
      } catch (err) {
        console.log(' Auth middleware - Header token verification failed:', err.message);
      }
    }
    
    if (!decoded) {
      console.log(' Auth middleware - No valid token found');
      return next(new ErrorHandler("Authentication required. Please login to continue.", 401));
    }

    // Enhanced security: Check if token structure is valid
    if (!decoded.id || !decoded.email) {
      return next(new ErrorHandler("Invalid token format. Please login again.", 401));
    }

    // Find user in database
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ErrorHandler("User account not found. Please contact support.", 404));
    }

    // Security validation: Check if account is still verified
    if (!user.accountVerified) {
      return next(new ErrorHandler("Account verification required. Please verify your email.", 403));
    }

    // Enhanced security: Device fingerprint validation (optional for high security)
    if (decoded.deviceFingerprint && envConfig.isProduction()) {
      const currentFingerprint = generateDeviceFingerprint(req);
      if (decoded.deviceFingerprint !== currentFingerprint) {
        console.warn(`🔒 Device fingerprint mismatch for user ${user.email}`);
        // In production, you might want to require re-authentication
        // For now, we'll log it but allow the request
      }
    }

    // Enhanced security: Check token age for admin users
    if (user.role === 'Admin' && decoded.loginTime) {
      const tokenAge = Date.now() - decoded.loginTime;
      const maxAdminSessionTime = 4 * 60 * 60 * 1000; // 4 hours for admin
      
      if (tokenAge > maxAdminSessionTime) {
        return next(new ErrorHandler("Admin session expired. Please login again for security.", 401));
      }
    }

    // Set enhanced user object with security metadata
    req.user = {
      _id: user._id,
      email: user.email.toLowerCase(),
      role: user.role,
      name: user.name,
      full: user,
      
      // Security metadata from token
      security: {
        sessionId: decoded.sessionId,
        loginTime: decoded.loginTime,
        securityLevel: decoded.securityLevel,
        deviceFingerprint: decoded.deviceFingerprint,
        tokenId: decoded.jti // JWT ID for tracking
      },
      
      // Permissions for easier access control
      permissions: {
        canBorrow: user.accountVerified && user.role === 'User',
        canManageBooks: user.role === 'Admin',
        canManageUsers: user.role === 'Admin',
        canAccessDashboard: user.accountVerified
      }
    };

    // Log security event for monitoring
    console.log(`🔐 User authenticated: ${user.email} (${user.role}) - Session: ${decoded.sessionId?.substring(0, 8)}...`);

    next();
    
  } catch (error) {
    // Enhanced error handling
    if (error.name === 'TokenExpiredError') {
      return next(new ErrorHandler("Your session has expired. Please login again.", 401));
    }
    
    if (error.name === 'JsonWebTokenError') {
      return next(new ErrorHandler("Invalid authentication token. Please login again.", 401));
    }
    
    if (error.name === 'NotBeforeError') {
      return next(new ErrorHandler("Token not active yet. Please try again.", 401));
    }
    
    console.error('🔒 Authentication error:', error);
    return next(new ErrorHandler("Authentication failed. Please try again.", 401));
  }
});

/**
 * Enhanced authorization middleware with role-based and permission-based access
 */
export const isAuthorized = (...allowedRoles) => (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ErrorHandler("Authentication required before authorization.", 401));
    }

    const userRole = req.user.role.toLowerCase();
    const allowed = allowedRoles.map(role => role.toLowerCase());

    if (!allowed.includes(userRole)) {
      console.warn(`🚫 Unauthorized access attempt: User ${req.user.email} (${req.user.role}) tried to access ${allowed.join('/')} restricted resource`);
      return next(new ErrorHandler(`Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`, 403));
    }

    // Enhanced security: Check security level for sensitive operations
    if (allowedRoles.includes('Admin') && req.user.security?.securityLevel !== 'high') {
      return next(new ErrorHandler("Admin access requires high security level.", 403));
    }

    console.log(`✅ Authorization granted: ${req.user.email} (${req.user.role}) accessing ${allowedRoles.join('/')} resource`);
    next();
    
  } catch (error) {
    console.error('🔒 Authorization error:', error);
    return next(new ErrorHandler("Authorization check failed.", 500));
  }
};

/**
 * Permission-based authorization middleware
 */
export const hasPermission = (permission) => (req, res, next) => {
  try {
    if (!req.user || !req.user.permissions) {
      return next(new ErrorHandler("Authentication required.", 401));
    }

    if (!req.user.permissions[permission]) {
      return next(new ErrorHandler(`Permission denied. Required permission: ${permission}`, 403));
    }

    next();
  } catch (error) {
    console.error('🔒 Permission check error:', error);
    return next(new ErrorHandler("Permission check failed.", 500));
  }
};

/**
 * Middleware to require account verification
 */
export const requireVerification = (req, res, next) => {
  if (!req.user?.full?.accountVerified) {
    return next(new ErrorHandler("Account verification required. Please verify your email address.", 403));
  }
  next();
};

/**
 * Rate limiting middleware for sensitive operations
 */
export const rateLimitSensitive = (maxAttempts = 3, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.user?.email || req.ip;
    const now = Date.now();
    const userAttempts = attempts.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (now > userAttempts.resetTime) {
      userAttempts.count = 0;
      userAttempts.resetTime = now + windowMs;
    }
    
    if (userAttempts.count >= maxAttempts) {
      return next(new ErrorHandler("Too many attempts. Please try again later.", 429));
    }
    
    userAttempts.count++;
    attempts.set(key, userAttempts);
    
    next();
  };
};