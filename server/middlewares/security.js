// 🛡️ Comprehensive Security Middleware
// Implements Helmet, CORS, Rate Limiting, and Advanced Security Features

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import envConfig from '../config/environment.js';
import ErrorHandler from './errorMiddlewares.js';

/**
 * Enhanced CORS configuration with strict origin validation
 */
export const configureCORS = () => {
  const serverConfig = envConfig.getServerConfig();
  const isDevelopment = envConfig.isDevelopment();
  
  console.log(' CORS Configuration:', {
    allowedOrigins: serverConfig.allowedOrigins,
    isDevelopment: isDevelopment,
    frontendUrl: serverConfig.frontendUrl
  });
  
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, postman, etc.)
      if (!origin && isDevelopment) {
        console.log(' CORS: Allowing request with no origin (development mode)');
        return callback(null, true);
      }
      
      // Check against allowed origins
      const allowedOrigins = serverConfig.allowedOrigins;
      
      if (allowedOrigins.includes('*')) {
        console.log(' CORS: Allowing all origins (*)');
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        console.log(' CORS: Allowing origin:', origin);
        return callback(null, true);
      }
      
      // Log security violation
      console.warn(`🚫 CORS violation: Blocked origin ${origin}`);
      return callback(new Error(`CORS policy violation: Origin ${origin} not allowed`), false);
    },
    
    credentials: true, // Allow cookies
    
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'X-Access-Token',
      'X-API-Key'
    ],
    
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    
    maxAge: 86400, // 24 hours
    
    // Enhanced security for preflight requests
    preflightContinue: false,
    optionsSuccessStatus: 204
  };
  
  return cors(corsOptions);
};

/**
 * Enhanced Helmet configuration for security headers
 */
export const configureHelmet = () => {
  const isProduction = envConfig.isProduction();
  
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.cloudinary.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: isProduction ? [] : null
      }
    },
    
    // Cross Origin Embedder Policy
    crossOriginEmbedderPolicy: false, // Disable for Cloudinary compatibility
    
    // DNS Prefetch Control
    dnsPrefetchControl: { allow: false },
    
    // Frame Options
    frameguard: { action: 'deny' },
    
    // Hide Powered By
    hidePoweredBy: true,
    
    // HSTS (HTTP Strict Transport Security)
    hsts: isProduction ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    } : false,
    
    // IE No Open
    ieNoOpen: true,
    
    // No Sniff
    noSniff: true,
    
    // Origin Agent Cluster
    originAgentCluster: true,
    
    // Permitted Cross Domain Policies
    permittedCrossDomainPolicies: false,
    
    // Referrer Policy
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    
    // X-XSS-Protection
    xssFilter: true
  });
};

/**
 * General rate limiting for all requests
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: envConfig.getSecurityConfig().rateLimitMaxRequests || 100, // Limit each IP to 100 requests per windowMs
  
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again later.",
    retryAfter: "15 minutes",
    type: "RATE_LIMIT_EXCEEDED"
  },
  
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  
  // Custom key generator for better tracking
  keyGenerator: (req) => {
    return req.user?.email || req.ip;
  },
  
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    console.warn(`🚫 Rate limit exceeded for IP: ${req.ip}, User: ${req.user?.email || 'Anonymous'}`);
    
    res.status(429).json({
      success: false,
      message: "Too many requests. Please slow down and try again later.",
      retryAfter: "15 minutes",
      type: "RATE_LIMIT_EXCEEDED",
      timestamp: new Date().toISOString()
    });
  },
  
  // Skip rate limiting for certain conditions
  skip: (req) => {
    // Skip for admin users in development
    if (envConfig.isDevelopment() && req.user?.role === 'Admin') {
      return true;
    }
    return false;
  }
});

/**
 * Strict rate limiting for authentication endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  
  message: {
    success: false,
    message: "Too many authentication attempts. Please wait 15 minutes before trying again.",
    retryAfter: "15 minutes",
    type: "AUTH_RATE_LIMIT_EXCEEDED",
    security: "This limitation helps protect against brute force attacks."
  },
  
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    // Combine IP and email for more targeted limiting
    const email = req.body?.email || '';
    return `${req.ip}:${email}`;
  },
  
  handler: (req, res) => {
    const email = req.body?.email || 'unknown';
    console.warn(`🚨 Authentication rate limit exceeded for IP: ${req.ip}, Email: ${email}`);
    
    res.status(429).json({
      success: false,
      message: "Too many authentication attempts. Please wait before trying again.",
      retryAfter: "15 minutes",
      type: "AUTH_RATE_LIMIT_EXCEEDED",
      timestamp: new Date().toISOString(),
      security: "Account temporarily locked for security."
    });
  }
});

/**
 * Admin action rate limiting
 */
export const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit admin actions
  
  message: {
    success: false,
    message: "Too many admin actions. Please wait before performing more administrative tasks.",
    retryAfter: "5 minutes",
    type: "ADMIN_RATE_LIMIT_EXCEEDED"
  },
  
  keyGenerator: (req) => {
    return req.user?.email || req.ip;
  },
  
  skip: (req) => {
    // Only apply to admin users
    return req.user?.role !== 'Admin';
  }
});

/**
 * Speed limiting (slow down responses instead of blocking)
 */
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: () => 500, // Add 500ms delay per request after delayAfter (new behavior)
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  validate: { delayMs: false }, // Disable validation warning
  
  keyGenerator: (req) => {
    return req.user?.email || req.ip;
  }
});

/**
 * File upload rate limiting
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit to 10 uploads per hour
  
  message: {
    success: false,
    message: "Upload limit exceeded. Please wait before uploading more files.",
    retryAfter: "1 hour",
    type: "UPLOAD_RATE_LIMIT_EXCEEDED"
  },
  
  keyGenerator: (req) => {
    return req.user?.email || req.ip;
  }
});

/**
 * Password reset rate limiting
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 password reset attempts per hour
  
  message: {
    success: false,
    message: "Too many password reset attempts. Please wait 1 hour before trying again.",
    retryAfter: "1 hour",
    type: "PASSWORD_RESET_RATE_LIMIT_EXCEEDED"
  },
  
  keyGenerator: (req) => {
    const email = req.body?.email || '';
    return `password_reset:${req.ip}:${email}`;
  }
});

/**
 * Enhanced security monitoring middleware
 */
export const securityMonitoring = (req, res, next) => {
  // Track security-relevant headers
  const securityHeaders = {
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    referer: req.get('Referer'),
    xForwardedFor: req.get('X-Forwarded-For'),
    xRealIp: req.get('X-Real-IP')
  };
  
  // Detect potential security threats
  const threats = [];
  
  // Check for suspicious user agents
  const suspiciousAgents = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /hack/i, /attack/i, /exploit/i
  ];
  
  if (securityHeaders.userAgent) {
    const isSuspicious = suspiciousAgents.some(pattern => 
      pattern.test(securityHeaders.userAgent)
    );
    
    if (isSuspicious) {
      threats.push('SUSPICIOUS_USER_AGENT');
    }
  }
  
  // Check for SQL injection patterns in URL
  const sqlPatterns = [
    /union/i, /select/i, /drop/i, /delete/i,
    /insert/i, /update/i, /exec/i, /script/i
  ];
  
  const urlCheck = req.originalUrl + JSON.stringify(req.query);
  if (sqlPatterns.some(pattern => pattern.test(urlCheck))) {
    threats.push('POTENTIAL_SQL_INJECTION');
  }
  
  // Log security events
  if (threats.length > 0) {
    console.warn('🚨 Security threat detected:', {
      ip: req.ip,
      threats,
      url: req.originalUrl,
      method: req.method,
      headers: securityHeaders,
      timestamp: new Date().toISOString()
    });
  }
  
  // Add security metadata to request
  req.security = {
    threats,
    headers: securityHeaders,
    timestamp: new Date().toISOString()
  };
  
  next();
};

/**
 * Enhanced error handling for security middleware
 */
export const securityErrorHandler = (err, req, res, next) => {
  // Handle CORS errors
  if (err.message.includes('CORS policy violation')) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Origin not allowed.",
      type: "CORS_VIOLATION",
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle other security errors
  if (err.name === 'SecurityError') {
    return res.status(400).json({
      success: false,
      message: "Security validation failed.",
      type: "SECURITY_ERROR",
      timestamp: new Date().toISOString()
    });
  }
  
  next(err);
};

/**
 * Comprehensive security middleware setup
 */
export const setupSecurity = (app) => {
  // Apply security headers first
  app.use(configureHelmet());
  
  // Configure CORS
  app.use(configureCORS());
  
  // Apply general rate limiting
  app.use(generalRateLimit);
  
  // Apply speed limiting
  app.use(speedLimiter);
  
  // Security monitoring
  app.use(securityMonitoring);
  
  // Security error handling
  app.use(securityErrorHandler);
  
  console.log('🛡️ Security middleware configured successfully');
};