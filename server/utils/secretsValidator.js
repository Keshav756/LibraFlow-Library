import crypto from 'crypto';
import envConfig from '../config/environment.js';

/**
 * Enhanced secrets validation utility
 * Provides comprehensive validation and generation of secure secrets
 */

// Minimum length requirements for different types of secrets
const SECRET_REQUIREMENTS = {
  jwt: 64,        // 512 bits
  session: 32,    // 256 bits
  encryption: 32, // 256 bits
  api: 32         // 256 bits
};

/**
 * Generate cryptographically secure random secret
 * @param {number} length - Length of the secret in bytes
 * @returns {string} Hex-encoded random secret
 */
export const generateSecureSecret = (length = 32) => {
  if (length < 16) {
    throw new Error('Secret length must be at least 16 bytes for security');
  }
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Validate secret strength
 * @param {string} secret - Secret to validate
 * @param {string} type - Type of secret (jwt, session, encryption, api)
 * @returns {object} Validation result
 */
export const validateSecretStrength = (secret, type = 'jwt') => {
  const minLength = SECRET_REQUIREMENTS[type] || 32;
  
  // Basic checks
  const checks = {
    length: secret.length >= minLength,
    hasLowercase: /[a-z]/.test(secret),
    hasUppercase: /[A-Z]/.test(secret),
    hasNumbers: /\d/.test(secret),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(secret),
    noPredictablePatterns: !/(.)\1{2,}/.test(secret) && !/123|abc/.test(secret.toLowerCase())
  };
  
  const isStrong = Object.values(checks).every(check => check === true);
  
  return {
    isStrong,
    checks,
    recommendations: isStrong ? [] : getRecommendations(checks, minLength)
  };
};

/**
 * Get recommendations for improving secret strength
 * @param {object} checks - Validation checks results
 * @param {number} minLength - Minimum required length
 * @returns {array} Recommendations
 */
const getRecommendations = (checks, minLength) => {
  const recommendations = [];
  
  if (!checks.length) {
    recommendations.push(`Increase length to at least ${minLength} characters`);
  }
  
  if (!checks.hasLowercase) {
    recommendations.push('Add lowercase letters');
  }
  
  if (!checks.hasUppercase) {
    recommendations.push('Add uppercase letters');
  }
  
  if (!checks.hasNumbers) {
    recommendations.push('Add numbers');
  }
  
  if (!checks.hasSpecial) {
    recommendations.push('Add special characters (!@#$%^&*()_+-=[]{}|;:\'",./?)');
  }
  
  if (!checks.noPredictablePatterns) {
    recommendations.push('Remove repeated characters or predictable sequences');
  }
  
  return recommendations;
};

/**
 * Validate all critical environment secrets
 * @returns {object} Validation results
 */
export const validateAllSecrets = () => {
  const secrets = {
    jwt: envConfig.get('JWT_SECRET_KEY'),
    session: envConfig.get('SESSION_SECRET'),
    encryption: envConfig.get('ENCRYPTION_KEY')
  };
  
  const results = {};
  let allValid = true;
  
  for (const [type, secret] of Object.entries(secrets)) {
    if (!secret) {
      results[type] = {
        valid: false,
        error: 'Missing secret',
        recommendation: `Set ${type.toUpperCase()}_SECRET in environment variables`
      };
      allValid = false;
      continue;
    }
    
    const validation = validateSecretStrength(secret, type);
    results[type] = {
      valid: validation.isStrong,
      strength: validation.isStrong ? 'Strong' : 'Weak',
      recommendations: validation.recommendations
    };
    
    if (!validation.isStrong) {
      allValid = false;
    }
  }
  
  return {
    allValid,
    secrets: results
  };
};

/**
 * Generate all required secrets template
 * @returns {object} Template with generated secrets
 */
export const generateSecretsTemplate = () => {
  return {
    JWT_SECRET_KEY: generateSecureSecret(SECRET_REQUIREMENTS.jwt),
    SESSION_SECRET: generateSecureSecret(SECRET_REQUIREMENTS.session),
    ENCRYPTION_KEY: generateSecureSecret(SECRET_REQUIREMENTS.encryption),
    API_SECRET: generateSecureSecret(SECRET_REQUIREMENTS.api)
  };
};

// Run validation on startup in development
if (envConfig.isDevelopment()) {
  const validation = validateAllSecrets();
  if (!validation.allValid) {
    console.warn('⚠️  Weak or missing secrets detected:');
    Object.entries(validation.secrets).forEach(([type, result]) => {
      if (!result.valid || result.strength === 'Weak') {
        console.warn(`   • ${type}: ${result.strength || result.error}`);
        if (result.recommendations?.length) {
          result.recommendations.forEach(rec => console.warn(`     - ${rec}`));
        }
      }
    });
  }
}

export default {
  generateSecureSecret,
  validateSecretStrength,
  validateAllSecrets,
  generateSecretsTemplate
};