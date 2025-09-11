import jwt from "jsonwebtoken";
import envConfig from "../config/environment.js";
import crypto from "crypto";

/**
 * Enhanced JWT Token Management with Advanced Security Features
 * Provides comprehensive token generation, validation, and secure cookie handling
 */

/**
 * Generate device fingerprint for enhanced security
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
 * Get intelligent cookie security configuration based on environment
 */
const getCookieSecurityConfig = (req) => {
  const serverConfig = envConfig.getServerConfig();
  const isProduction = envConfig.isProduction();
  const isDevelopment = envConfig.isDevelopment();
  
  // Detect if request is cross-origin
  const origin = req?.get('origin');
  const isCrossOrigin = origin && !serverConfig.allowedOrigins.includes(origin);
  
  // Enhanced security configuration with additional protections
  const securityConfig = {
    // Basic security flags
    httpOnly: true,                          // Prevent XSS attacks
    secure: isProduction,                    // HTTPS only in production
    signed: true,                            // Sign cookies to prevent tampering
    
    // SameSite configuration - intelligent selection
    sameSite: (() => {
      if (isDevelopment) return 'Lax';       // More permissive for development
      if (isCrossOrigin) return 'None';      // Required for cross-site requests
      return 'Strict';                       // Most secure for same-site
    })(),
    
    // Domain configuration for production
    ...(isProduction && serverConfig.cookieDomain && {
      domain: serverConfig.cookieDomain
    }),
    
    // Path restriction
    path: '/',
    
    // Expiration with intelligent calculation
    expires: new Date(
      Date.now() + serverConfig.cookieExpire * 24 * 60 * 60 * 1000
    ),
    
    // Additional security headers for modern browsers
    ...(isProduction && {
      priority: 'high',                      // High priority cookie
    })
  };
  
  return securityConfig;
};

/**
 * Enhanced token payload with security metadata
 */
const createEnhancedTokenPayload = (user, req) => {
  const deviceFingerprint = generateDeviceFingerprint(req);
  const loginTime = Date.now();
  
  return {
    // User identification
    id: user._id,
    email: user.email.toLowerCase(),
    role: user.role,
    
    // Security metadata
    deviceFingerprint,
    loginTime,
    sessionId: crypto.randomBytes(16).toString('hex'),
    
    // Account verification status
    verified: user.accountVerified,
    
    // Security level indicator
    securityLevel: user.role === 'Admin' ? 'high' : 'standard'
  };
};

/**
 * Enhanced JWT token generation with advanced security
 */
const generateSecureToken = (user, req) => {
  const jwtConfig = envConfig.getJWTConfig();
  const payload = createEnhancedTokenPayload(user, req);
  
  // Enhanced JWT options
  const tokenOptions = {
    expiresIn: jwtConfig.expiresIn,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    algorithm: 'HS256',                      // Specify algorithm for security
    notBefore: '0',                          // Token valid immediately
    jwtid: crypto.randomBytes(16).toString('hex'), // Unique token ID for tracking
  };
  
  return jwt.sign(payload, jwtConfig.secret, tokenOptions);
};

/**
 * Enhanced user data response with security considerations
 */
const createSecureUserResponse = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email.toLowerCase(),
    role: user.role,
    accountVerified: user.accountVerified,
    
    // Additional security metadata
    permissions: {
      canBorrow: user.accountVerified && user.role === 'User',
      canManageBooks: user.role === 'Admin',
      canManageUsers: user.role === 'Admin',
      canAccessDashboard: user.accountVerified
    },
    
    // Profile metadata
    profile: {
      hasAvatar: !!user.avatar?.url,
      joinedAt: user.createdAt,
      lastLoginAt: new Date().toISOString()
    },
    
    // Security settings
    security: {
      passwordLastChanged: user.passwordLastChanged || user.createdAt,
      requiresPasswordChange: false, // Could be enhanced based on policy
      sessionTimeout: envConfig.getJWTConfig().expiresIn
    }
  };
};

/**
 * Log security events for monitoring
 */
const logSecurityEvent = (user, req, eventType = 'login') => {
  const securityLog = {
    timestamp: new Date().toISOString(),
    userId: user._id,
    email: user.email,
    eventType,
    ipAddress: req?.ip || 'unknown',
    userAgent: req?.get('User-Agent') || 'unknown',
    deviceFingerprint: generateDeviceFingerprint(req)
  };
  
  // In a production environment, this would be sent to a security monitoring service
  console.log(`🔒 Security Event: ${eventType.toUpperCase()}`, {
    user: user.email,
    ip: securityLog.ipAddress,
    timestamp: securityLog.timestamp
  });
  
  return securityLog;
};

/**
 * Main enhanced sendToken function with comprehensive security
 */
export const sendToken = (user, statusCode, message, res, req = null) => {
  try {
    // Generate secure token with enhanced payload
    const token = generateSecureToken(user, req);
    
    // Get intelligent cookie security configuration
    const cookieOptions = getCookieSecurityConfig(req);
    
    // Create secure user response
    const userResponse = createSecureUserResponse(user);
    
    // Log security event
    logSecurityEvent(user, req, 'token_generated');
    
    // Enhanced response with security metadata
    const response = {
      success: true,
      message,
      token,
      user: userResponse,
      
      // Security metadata for client
      security: {
        tokenType: 'Bearer',
        expiresIn: envConfig.getJWTConfig().expiresIn,
        cookieSecure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        sessionId: userResponse.security?.sessionId
      },
      
      // Server metadata
      server: {
        timestamp: new Date().toISOString(),
        environment: envConfig.get('NODE_ENV'),
        version: '1.0.0' // Could be dynamic
      }
    };
    
    // Set secure cookie and send response
    res.status(statusCode)
       .cookie("token", token, cookieOptions)
       .json(response);
    
    // Additional security headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    
    console.log(`✅ Secure token sent to ${user.email} with ${cookieOptions.sameSite} SameSite policy`);
    
  } catch (error) {
    console.error('❌ Error in sendToken:', error);
    
    // Secure error response (don't leak sensitive information)
    res.status(500).json({
      success: false,
      message: 'Authentication service temporarily unavailable',
      error: envConfig.isDevelopment() ? error.message : undefined
    });
  }
};

/**
 * Utility function to clear authentication cookies securely
 */
export const clearToken = (res, req = null) => {
  const cookieOptions = getCookieSecurityConfig(req);
  
  res.clearCookie('token', {
    ...cookieOptions,
    expires: new Date(0) // Expire immediately
  });
  
  console.log('🔒 Authentication token cleared securely');
};

/**
 * Validate token security configuration
 */
export const validateTokenSecurity = () => {
  const jwtConfig = envConfig.getJWTConfig();
  const serverConfig = envConfig.getServerConfig();
  
  const validations = {
    secretLength: jwtConfig.secret.length >= 32,
    httpsInProduction: !envConfig.isProduction() || serverConfig.secure,
    cookieExpiration: serverConfig.cookieExpire > 0,
    jwtExpiration: !!jwtConfig.expiresIn
  };
  
  const isSecure = Object.values(validations).every(Boolean);
  
  if (!isSecure) {
    console.warn('⚠️ Token security validation failed:', validations);
  }
  
  return { isSecure, validations };
};