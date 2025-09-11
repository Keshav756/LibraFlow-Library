// 🔒 Comprehensive Input Validation & Sanitization Middleware
// Protects against NoSQL injection, XSS, and malformed data

import Joi from 'joi';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';
import ErrorHandler from './errorMiddlewares.js';

/**
 * Enhanced sanitization utilities
 */
class InputSanitizer {
  // Remove potential NoSQL injection patterns
  static sanitizeNoSQL(input) {
    if (typeof input !== 'string') return input;
    
    // Remove common NoSQL injection patterns
    const dangerousPatterns = [
      /\$where/gi,
      /\$ne/gi,
      /\$in/gi,
      /\$nin/gi,
      /\$or/gi,
      /\$and/gi,
      /\$not/gi,
      /\$nor/gi,
      /\$exists/gi,
      /\$type/gi,
      /\$mod/gi,
      /\$regex/gi,
      /\$text/gi,
      /\$search/gi,
      /javascript:/gi,
      /<script/gi,
      /eval\(/gi,
      /function\(/gi
    ];
    
    let sanitized = input;
    dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized.trim();
  }
  
  // Sanitize HTML content
  static sanitizeHTML(input) {
    if (typeof input !== 'string') return input;
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [] 
    });
  }
  
  // Normalize email
  static sanitizeEmail(email) {
    if (!email || typeof email !== 'string') return '';
    return validator.normalizeEmail(email.toLowerCase().trim()) || '';
  }
  
  // Sanitize phone numbers
  static sanitizePhone(phone) {
    if (!phone || typeof phone !== 'string') return '';
    return phone.replace(/[^\d+\-\(\)\s]/g, '').trim();
  }
  
  // Sanitize names (alphabetic + spaces + common symbols)
  static sanitizeName(name) {
    if (!name || typeof name !== 'string') return '';
    return name.replace(/[^a-zA-Z\s\-\.\']/g, '').trim();
  }
  
  // Deep sanitize object
  static deepSanitize(obj) {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanKey = this.sanitizeNoSQL(key);
        sanitized[cleanKey] = this.deepSanitize(value);
      }
      return sanitized;
    }
    
    if (typeof obj === 'string') {
      return this.sanitizeNoSQL(this.sanitizeHTML(obj));
    }
    
    return obj;
  }
}

/**
 * Validation schemas for different entities
 */
export const ValidationSchemas = {
  // User registration validation
  userRegistration: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s\-\.\']+$/)
      .required()
      .messages({
        'string.pattern.base': 'Name can only contain letters, spaces, hyphens, dots, and apostrophes',
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 50 characters'
      }),
    
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .max(100)
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 128 characters'
      })
  }),
  
  // User login validation
  userLogin: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    
    password: Joi.string()
      .min(1)
      .max(128)
      .required()
  }),
  
  // OTP validation
  otpVerification: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    
    otp: Joi.string()
      .pattern(/^\d{5}$/)
      .required()
      .messages({
        'string.pattern.base': 'OTP must be exactly 5 digits'
      })
  }),
  
  // Password reset validation
  passwordReset: Joi.object({
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required(),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords do not match'
      })
  }),
  
  // Book creation/update validation
  book: Joi.object({
    title: Joi.string()
      .min(1)
      .max(200)
      .required()
      .messages({
        'string.min': 'Book title is required',
        'string.max': 'Book title cannot exceed 200 characters'
      }),
    
    author: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'Author name is required',
        'string.max': 'Author name cannot exceed 100 characters'
      }),
    
    isbn: Joi.string()
      .pattern(/^(?:ISBN(?:-1[03])?:?\s)?(?=[0-9X]{10}$|(?=(?:[0-9]+[-\s]){3})[-\s0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[-\s]){4})[-\s0-9]{17}$)(?:97[89][-\s]?)?[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9X]$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid ISBN number'
      }),
    
    category: Joi.string()
      .min(1)
      .max(50)
      .required(),
    
    description: Joi.string()
      .max(1000)
      .optional(),
    
    totalCopies: Joi.number()
      .integer()
      .min(1)
      .max(1000)
      .required()
      .messages({
        'number.min': 'Total copies must be at least 1',
        'number.max': 'Total copies cannot exceed 1000'
      }),
    
    price: Joi.number()
      .positive()
      .precision(2)
      .max(10000)
      .optional()
      .messages({
        'number.positive': 'Price must be a positive number',
        'number.max': 'Price cannot exceed $10,000'
      })
  }),
  
  // Borrowing validation
  borrowBook: Joi.object({
    bookId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid book ID format'
      }),
    
    dueDate: Joi.date()
      .greater('now')
      .max('now')
      .max(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) // Max 90 days
      .optional()
  }),
  
  // Admin creation validation
  adminCreation: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s\-\.\']+$/)
      .required(),
    
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    
    password: Joi.string()
      .min(12) // Stricter for admin accounts
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
  })
};

/**
 * Generic validation middleware factory
 */
export const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      // Get data from specified source
      const data = req[source];
      
      // Deep sanitize the input data
      const sanitizedData = InputSanitizer.deepSanitize(data);
      
      // Validate against schema
      const { error, value } = schema.validate(sanitizedData, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });
      
      if (error) {
        const errorMessages = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));
        
        return next(new ErrorHandler(
          `Validation failed: ${errorMessages.map(e => e.message).join(', ')}`,
          400,
          { validationErrors: errorMessages }
        ));
      }
      
      // Replace original data with validated and sanitized data
      req[source] = value;
      
      // Add sanitization metadata for logging
      req.validationMetadata = {
        source,
        originalDataKeys: Object.keys(data || {}),
        sanitizedDataKeys: Object.keys(value || {}),
        timestamp: new Date().toISOString()
      };
      
      next();
    } catch (error) {
      console.error('🔒 Validation middleware error:', error);
      return next(new ErrorHandler('Validation service error', 500));
    }
  };
};

/**
 * Email-specific validation and sanitization
 */
export const validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return next(new ErrorHandler('Email is required', 400));
  }
  
  // Sanitize and validate email
  const sanitizedEmail = InputSanitizer.sanitizeEmail(email);
  
  if (!validator.isEmail(sanitizedEmail)) {
    return next(new ErrorHandler('Please provide a valid email address', 400));
  }
  
  // Check for disposable email providers
  const disposableProviders = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
    'mailinator.com', 'throwaway.email'
  ];
  
  const domain = sanitizedEmail.split('@')[1];
  if (disposableProviders.includes(domain)) {
    return next(new ErrorHandler('Disposable email addresses are not allowed', 400));
  }
  
  req.body.email = sanitizedEmail;
  next();
};

/**
 * File upload validation
 */
export const validateFileUpload = (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return next(); // Skip if no files
    }
    
    const file = req.files.avatar || req.files.cover || Object.values(req.files)[0];
    
    if (!file) {
      return next();
    }
    
    // Validate file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      return next(new ErrorHandler(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        400
      ));
    }
    
    // Validate file size
    if (file.size > maxSize) {
      return next(new ErrorHandler(
        `File size too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
        400
      ));
    }
    
    // Validate file name
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    if (sanitizedName !== file.name) {
      file.name = sanitizedName;
    }
    
    next();
  };
};

/**
 * Request rate limiting validation
 */
export const validateRequestFrequency = (maxRequests = 5, windowMs = 15 * 60 * 1000) => {
  const requestMap = new Map();
  
  return (req, res, next) => {
    const identifier = req.ip + (req.user?.email || '');
    const now = Date.now();
    
    if (!requestMap.has(identifier)) {
      requestMap.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const userData = requestMap.get(identifier);
    
    if (now > userData.resetTime) {
      userData.count = 1;
      userData.resetTime = now + windowMs;
      return next();
    }
    
    if (userData.count >= maxRequests) {
      return next(new ErrorHandler(
        `Too many requests. Please try again later.`,
        429
      ));
    }
    
    userData.count++;
    next();
  };
};

/**
 * Comprehensive sanitization middleware for all requests
 */
export const sanitizeRequest = (req, res, next) => {
  try {
    // Sanitize query parameters
    if (req.query) {
      req.query = InputSanitizer.deepSanitize(req.query);
    }
    
    // Sanitize request body
    if (req.body) {
      req.body = InputSanitizer.deepSanitize(req.body);
    }
    
    // Sanitize URL parameters
    if (req.params) {
      req.params = InputSanitizer.deepSanitize(req.params);
    }
    
    // Log sanitization for security monitoring
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Request sanitized:', {
        ip: req.ip,
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  } catch (error) {
    console.error('🔒 Sanitization error:', error);
    return next(new ErrorHandler('Request processing error', 500));
  }
};

// Export sanitizer class for direct use
export { InputSanitizer };

/**
 * Book-specific validation middleware
 */
export const validateBookInput = (req, res, next) => {
  const { error } = ValidationSchemas.book.validate(req.body);
  if (error) {
    return next(new ErrorHandler(error.details[0].message, 400));
  }
  next();
};

export const validateBookUpdate = (req, res, next) => {
  // For updates, make all fields optional
  const updateSchema = ValidationSchemas.book.fork(
    Object.keys(ValidationSchemas.book.describe().keys),
    (schema) => schema.optional()
  );
  
  const { error } = updateSchema.validate(req.body);
  if (error) {
    return next(new ErrorHandler(error.details[0].message, 400));
  }
  next();
};

export const validateAvailabilityUpdate = (req, res, next) => {
  const availabilitySchema = Joi.object({
    action: Joi.string()
      .valid('borrow', 'return', 'reserve', 'unreserve')
      .required()
      .messages({
        'any.only': 'Action must be one of: borrow, return, reserve, unreserve'
      }),
    
    count: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .default(1)
      .messages({
        'number.min': 'Count must be at least 1',
        'number.max': 'Count cannot exceed 10'
      })
  });
  
  const { error, value } = availabilitySchema.validate(req.body);
  if (error) {
    return next(new ErrorHandler(error.details[0].message, 400));
  }
  
  // Set validated values back to request
  req.body = value;
  next();
};

export const validateObjectId = (paramName, required = true) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    // If parameter is not required and not provided, skip validation
    if (!required && !id) {
      return next();
    }
    
    // If parameter is required but not provided, return error
    if (required && !id) {
      return next(new ErrorHandler(`${paramName} parameter is required`, 400));
    }
    
    // MongoDB ObjectId validation
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new ErrorHandler(`Invalid ${paramName} format`, 400));
    }
    
    next();
  };
};

/**
 * Book data validation function for direct use
 */
export const validateBookData = async (bookData) => {
  const { error, value } = ValidationSchemas.book.validate(bookData, {
    abortEarly: false,
    stripUnknown: true
  });
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    throw new ErrorHandler(`Validation error: ${errorMessage}`, 400);
  }
  
  return value;
};

/**
 * Setup validation middleware for the app
 */
export const setupValidationMiddleware = (app) => {
  // Apply global sanitization to all routes
  app.use(sanitizeRequest);
  
  console.log('✅ Validation middleware configured successfully');
  console.log('   • Global request sanitization: Active');
  console.log('   • NoSQL injection protection: Active');
  console.log('   • XSS protection: Active');
  console.log('   • Input validation schemas: Loaded');
};

/**
 * Fine management validation functions
 */
export const validateFinePayment = (req, res, next) => {
  const paymentSchema = Joi.object({
    amount: Joi.number()
      .positive()
      .precision(2)
      .max(10000)
      .required()
      .messages({
        'number.positive': 'Payment amount must be positive',
        'number.max': 'Payment amount cannot exceed ₹10,000',
        'any.required': 'Payment amount is required'
      }),
    
    method: Joi.string()
      .valid('CASH', 'CARD', 'UPI', 'NET_BANKING', 'CHEQUE')
      .default('CASH')
      .messages({
        'any.only': 'Payment method must be one of: CASH, CARD, UPI, NET_BANKING, CHEQUE'
      }),
    
    reference: Joi.string()
      .max(100)
      .optional()
      .messages({
        'string.max': 'Reference cannot exceed 100 characters'
      }),
    
    notes: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Notes cannot exceed 500 characters'
      })
  });
  
  const { error, value } = paymentSchema.validate(req.body);
  if (error) {
    return next(new ErrorHandler(error.details[0].message, 400));
  }
  
  req.body = value;
  next();
};

export const validateBulkCalculation = (req, res, next) => {
  const bulkSchema = Joi.object({
    borrowIds: Joi.array()
      .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
      .min(1)
      .max(100)
      .required()
      .messages({
        'array.min': 'At least one borrow ID is required',
        'array.max': 'Maximum 100 borrow IDs allowed per batch',
        'string.pattern.base': 'Invalid borrow ID format'
      }),
    
    updateRecords: Joi.boolean()
      .default(false),
    
    useParallel: Joi.boolean()
      .default(true),
    
    batchSize: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10)
      .messages({
        'number.min': 'Batch size must be at least 1',
        'number.max': 'Batch size cannot exceed 50'
      })
  });
  
  const { error, value } = bulkSchema.validate(req.body);
  if (error) {
    return next(new ErrorHandler(error.details[0].message, 400));
  }
  
  req.body = value;
  next();
};

export const validateAmnestyRequest = (req, res, next) => {
  const amnestySchema = Joi.object({
    reason: Joi.string()
      .valid(
        'ADMIN_AMNESTY',
        'GENERAL_AMNESTY', 
        'FIRST_TIME_FORGIVENESS',
        'SYSTEM_ERROR',
        'SPECIAL_CIRCUMSTANCES',
        'HOLIDAY_AMNESTY'
      )
      .default('ADMIN_AMNESTY')
      .messages({
        'any.only': 'Invalid amnesty reason'
      }),
    
    notes: Joi.string()
      .max(1000)
      .optional()
      .messages({
        'string.max': 'Notes cannot exceed 1000 characters'
      })
  });
  
  const { error, value } = amnestySchema.validate(req.body);
  if (error) {
    return next(new ErrorHandler(error.details[0].message, 400));
  }
  
  req.body = value;
  next();
};