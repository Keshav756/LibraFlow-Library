// Enhanced Environment Configuration Manager
// Provides secure environment variable loading with validation and fallbacks

import { config } from "dotenv";
import crypto from "crypto";
import path from "path";
import fs from "fs";

/**
 * Enhanced environment configuration with security validation
 */
class EnvironmentConfig {
  constructor() {
    this.loadEnvironment();
    this.validateRequired();
    this.validateSecurity();
  }

  /**
   * Load environment variables from multiple sources
   */
  loadEnvironment() {
    // Try loading from multiple possible locations
    const envPaths = [
      path.join(process.cwd(), '.env'),
      path.join(process.cwd(), 'server', '.env'),
      path.join(process.cwd(), 'config', 'config.env'),
      path.join(process.cwd(), 'server', 'config', 'config.env')
    ];

    let loaded = false;
    for (const envPath of envPaths) {
      if (fs.existsSync(envPath)) {
        config({ path: envPath });
        console.log(`✅ Environment loaded from: ${envPath}`);
        loaded = true;
        break;
      }
    }

    if (!loaded) {
      console.warn('⚠️ No environment file found. Using system environment variables.');
    }
  }

  /**
   * Validate required environment variables
   */
  validateRequired() {
    const required = [
      'PORT',
      'MONGO_URI',
      'JWT_SECRET_KEY',
      'SMTP_MAIL',
      'SMTP_PASSWORD',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach(key => console.error(`   • ${key}`));
      console.error('\n📖 Please check the environment configuration documentation.');
      process.exit(1);
    }

    console.log('✅ All required environment variables are present');
  }

  /**
   * Validate critical security configuration
   */
  validateSecurity() {
    const isProduction = this.isProduction();
    const secrets = {
      jwt: this.get('JWT_SECRET_KEY'),
      session: this.get('SESSION_SECRET'),
      encryption: this.get('ENCRYPTION_KEY')
    };

    // Check for missing secrets
    const missingSecrets = Object.entries(secrets)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key);

    if (missingSecrets.length > 0) {
      console.error(`❌ Missing critical secrets: ${missingSecrets.join(', ')}`);
      if (isProduction) {
        console.error('❌ Security issues detected in production environment!');
        process.exit(1);
      }
    }

    // Check for weak/default secrets
    const weakSecrets = Object.entries(secrets)
      .filter(([_, value]) => {
        if (!value) return false;
        // Check for common weak patterns
        return value.length < 32 || 
               value.includes('your_') || 
               value.includes('default') ||
               value === 'secret' ||
               value === 'password';
      })
      .map(([key, _]) => key);

    if (weakSecrets.length > 0) {
      console.warn(`⚠️  Weak secrets detected: ${weakSecrets.join(', ')}`);
      console.warn('⚠️  Please rotate these secrets with stronger values');
      if (isProduction) {
        console.error('❌ Security issues detected in production environment!');
        process.exit(1);
      }
    } else {
      console.log('🔒 Environment security validation passed');
    }
  }

  /**
   * Get environment variable with fallback and type conversion
   */
  get(key, fallback = null, type = 'string') {
    const value = process.env[key] || fallback;
    
    if (value === null) return null;

    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true' || value === '1';
      case 'array':
        return value.split(',').map(item => item.trim());
      default:
        return value;
    }
  }

  /**
   * Check if running in production environment
   */
  isProduction() {
    return this.get('NODE_ENV') === 'production';
  }

  /**
   * Check if running in development environment
   */
  isDevelopment() {
    return this.get('NODE_ENV', 'development') === 'development';
  }

  /**
   * Check if running in test environment
   */
  isTest() {
    return this.get('NODE_ENV') === 'test';
  }

  /**
   * Generate secure random secret
   */
  static generateSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Get database configuration
   */
  getDatabaseConfig() {
    return {
      uri: this.get('MONGO_URI'),
      dbName: this.get('DB_NAME', 'LibraFlow_LMS'),
      options: {
        maxPoolSize: this.get('DB_MAX_POOL_SIZE', 10, 'number'),
        serverSelectionTimeoutMS: this.get('DB_TIMEOUT', 5000, 'number'),
      }
    };
  }

  /**
   * Get JWT configuration
   */
  getJWTConfig() {
    return {
      secret: this.get('JWT_SECRET_KEY'),
      expiresIn: this.get('JWT_EXPIRE', '7d'),
      issuer: this.get('JWT_ISSUER', 'LibraFlow-LMS'),
      audience: this.get('JWT_AUDIENCE', 'LibraFlow-Users')
    };
  }

  /**
   * Get email configuration
   */
  getEmailConfig() {
    return {
      host: this.get('SMTP_HOST', 'smtp.gmail.com'),
      service: this.get('SMTP_SERVICE', 'gmail'),
      port: this.get('SMTP_PORT', 465, 'number'),
      secure: this.get('SMTP_SECURE', true, 'boolean'),
      auth: {
        user: this.get('SMTP_MAIL'),
        pass: this.get('SMTP_PASSWORD')
      },
      from: {
        name: this.get('EMAIL_FROM_NAME', 'LibraFlow Library'),
        address: this.get('SMTP_MAIL')
      }
    };
  }

  /**
   * Get Cloudinary configuration
   */
  getCloudinaryConfig() {
    return {
      cloud_name: this.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.get('CLOUDINARY_API_KEY'),
      api_secret: this.get('CLOUDINARY_API_SECRET'),
      secure: true,
      folder: this.get('CLOUDINARY_FOLDER', 'LibraFlow_Uploads')
    };
  }

  /**
   * Get server configuration
   */
  getServerConfig() {
    return {
      port: this.get('PORT', 4000, 'number'),
      host: this.get('HOST', '0.0.0.0'),
      frontendUrl: this.get('FRONTEND_URL', 'http://localhost:5173'),
      allowedOrigins: this.get('ALLOWED_ORIGINS', 'http://localhost:5173', 'array'),
      cookieExpire: this.get('COOKIE_EXPIRE', 3, 'number'),
      cookieDomain: this.get('COOKIE_DOMAIN'), // Optional: for production custom domains
      trustProxy: this.get('TRUST_PROXY', false, 'boolean'),
      secure: this.get('HTTPS_ENABLED', this.isProduction(), 'boolean')
    };
  }

  /**
   * Get security configuration
   */
  getSecurityConfig() {
    return {
      rateLimitWindowMs: this.get('RATE_LIMIT_WINDOW_MS', 900000, 'number'), // 15 minutes
      rateLimitMaxRequests: this.get('RATE_LIMIT_MAX_REQUESTS', 100, 'number'),
      sessionSecret: this.get('SESSION_SECRET', this.constructor.generateSecret()),
      encryptionKey: this.get('ENCRYPTION_KEY'),
      corsOrigins: this.get('CORS_ORIGINS', '*', 'array'),
      helmetEnabled: this.get('HELMET_ENABLED', true, 'boolean')
    };
  }

  /**
   * Get comprehensive configuration object
   */
  getConfig() {
    return {
      environment: this.get('NODE_ENV', 'development'),
      database: this.getDatabaseConfig(),
      jwt: this.getJWTConfig(),
      email: this.getEmailConfig(),
      cloudinary: this.getCloudinaryConfig(),
      server: this.getServerConfig(),
      security: this.getSecurityConfig(),
      isProduction: this.isProduction(),
      isDevelopment: this.isDevelopment(),
      isTest: this.isTest()
    };
  }
}

// Create and export singleton instance
const envConfig = new EnvironmentConfig();

export default envConfig;
export { EnvironmentConfig };