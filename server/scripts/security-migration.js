#!/usr/bin/env node

// 🔐 LibraFlow Security Migration Script
// This script helps migrate from insecure to secure environment configuration

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

console.log('🔐 LibraFlow Security Migration Tool');
console.log('=====================================\n');

// Generate secure secrets
const generateSecret = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

// Create secure environment template
const createSecureEnv = () => {
  const secureEnvContent = `# ===== LIBRAFLOW SECURE ENVIRONMENT =====
# Generated: ${new Date().toISOString()}
# NEVER commit this file to version control!

# ===== SERVER CONFIG =====
PORT=4000
NODE_ENV=development

# ===== MONGODB DATABASE =====
# Replace with your NEW MongoDB connection string
# CRITICAL: Create new user with strong password, do NOT reuse exposed credentials
MONGO_URI=mongodb+srv://NEW_USERNAME:NEW_STRONG_PASSWORD@your-cluster.mongodb.net/LibraFlow?retryWrites=true&w=majority
DB_NAME=LibraFlow_Library_Management_System

# ===== JWT AUTHENTICATION =====
# CRITICAL: Use this NEW secure JWT secret
JWT_SECRET_KEY=${generateSecret(64)}
JWT_EXPIRE=7d

# ===== FRONTEND URL =====
FRONTEND_URL=http://localhost:5173

# ===== EMAIL/SMTP CONFIGURATION =====
# CRITICAL: Create NEW Gmail app password
SMTP_HOST=smtp.gmail.com
SMTP_SERVICE=gmail
SMTP_PORT=465
SMTP_MAIL=your-new-email@gmail.com
SMTP_PASSWORD=your_new_gmail_app_password
COOKIE_EXPIRE=3

# ===== CLOUDINARY CONFIGURATION =====
# CRITICAL: Rotate ALL Cloudinary keys from dashboard
CLOUDINARY_CLOUD_NAME=your_new_cloud_name
CLOUDINARY_API_KEY=your_new_api_key
CLOUDINARY_API_SECRET=your_new_api_secret

# ===== SECURITY SETTINGS =====
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ===== ADDITIONAL SECURITY =====
SESSION_SECRET=${generateSecret(32)}
ENCRYPTION_KEY=${generateSecret(16)}
`;

  return secureEnvContent;
};

// Create security incident response documentation
const createSecurityIncidentDoc = () => {
  return `# 🚨 SECURITY INCIDENT RESPONSE - CREDENTIALS EXPOSURE

## Incident Details
**Date**: ${new Date().toISOString()}
**Type**: Credentials exposed in version control
**Severity**: CRITICAL
**Status**: Remediation in progress

## Exposed Credentials
The following credentials were found exposed in \`config.env\`:

### MongoDB Atlas
- **Username**: keshav02
- **Password**: keshav02
- **Cluster**: cluster0.nlitbhj.mongodb.net
- **Database**: LibraryDB

### Gmail SMTP
- **Email**: keshavmalik0756@gmail.com
- **App Password**: aecfmmzloctnjmnn

### Cloudinary
- **Cloud Name**: duceefwa0
- **API Key**: 657848115641787
- **API Secret**: lF8h5i3TQqC_N7Mb6hdYEw2Qf2o

### JWT
- **Secret**: libraflow_jwt_secret_key_2024_secure_and_unique (weak)

## Immediate Actions Taken
- [x] Identified exposed credentials
- [x] Created secure environment template
- [x] Updated .gitignore to protect secrets
- [x] Generated strong replacement secrets

## Required Actions
- [ ] **URGENT**: Rotate MongoDB credentials
- [ ] **URGENT**: Revoke and regenerate Gmail app password
- [ ] **URGENT**: Regenerate Cloudinary API keys
- [ ] Update production environment variables
- [ ] Test application with new credentials
- [ ] Monitor for suspicious access

## Security Measures Implemented
1. Enhanced environment configuration system
2. Environment validation and security scanning
3. Placeholder-only template system
4. Admin security management endpoints
5. Comprehensive .gitignore protection

## Lessons Learned
1. Never commit secrets to version control
2. Use environment variables for all sensitive data
3. Implement automated secret scanning
4. Regular security audits are essential
5. Incident response procedures are critical

## Prevention Measures
1. Pre-commit hooks for secret detection
2. Regular credential rotation schedule
3. Security training for development team
4. Automated security scanning in CI/CD
5. Access logging and monitoring

---
**Next Review**: 30 days from remediation completion
**Responsible**: Security Team
`;
};

// Main migration function
const migrate = () => {
  console.log('🚀 Starting security migration...\n');

  // CRITICAL: Detect exposed credentials from config.env
  console.log('🔴 SECURITY BREACH DETECTED!');
  console.log('The following credentials were EXPOSED in your repository:');
  console.log('   • MongoDB User: keshav02');
  console.log('   • MongoDB Password: keshav02');
  console.log('   • Gmail Email: keshavmalik0756@gmail.com');
  console.log('   • Gmail App Password: aecfmmzloctnjmnn');
  console.log('   • Cloudinary Cloud: duceefwa0');
  console.log('   • Cloudinary API Key: 657848115641787');
  console.log('   • Cloudinary Secret: lF8h5i3TQqC_N7Mb6hdYEw2Qf2o');
  console.log('   • JWT Secret: libraflow_jwt_secret_key_2024_secure_and_unique\n');
  
  console.log('⚠️  ALL THESE CREDENTIALS MUST BE ROTATED IMMEDIATELY!\n');

  try {
    // Create secure .env file
    const envContent = createSecureEnv();
    const envPath = path.join(process.cwd(), 'server', '.env');
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created secure .env file at:', envPath);

    // Show critical actions with specific details
    console.log('\n🔴 IMMEDIATE ACTIONS REQUIRED:');
    console.log('\n1. 🔄 MONGODB ATLAS - URGENT:');
    console.log('   • Login to MongoDB Atlas Dashboard');
    console.log('   • Database Access → Delete user "keshav02" immediately');
    console.log('   • Create new user with strong random password');
    console.log('   • Update connection string in .env file');
    
    console.log('\n2. 🔄 GMAIL SMTP - URGENT:');
    console.log('   • Google Account → Security → App Passwords');
    console.log('   • Revoke app password: aecfmmzloctnjmnn');
    console.log('   • Generate new 16-character app password');
    console.log('   • Consider using dedicated email: library@yourdomain.com');
    
    console.log('\n3. 🔄 CLOUDINARY - URGENT:');
    console.log('   • Cloudinary Dashboard → Settings → Security');
    console.log('   • Regenerate API Key (currently: 657848115641787)');
    console.log('   • Regenerate API Secret (currently: lF8h5i3TQqC_N7Mb6hdYEw2Qf2o)');
    console.log('   • Update cloud name if possible (currently: duceefwa0)');
    
    console.log('\n4. ✏️  UPDATE .ENV FILE:');
    console.log('   • Edit server/.env with your NEW rotated credentials');
    console.log('   • Never use the old exposed values again');
    
    console.log('\n5. 🧪 TEST APPLICATION:');
    console.log('   • Start server with new environment');
    console.log('   • Test all authentication flows');
    console.log('   • Verify email sending works');
    console.log('   • Test image uploads to Cloudinary\n');

    console.log('\n📋 Generated Secure Secrets:');
    console.log('JWT_SECRET_KEY: 64 characters ✅');
    console.log('SESSION_SECRET: 32 characters ✅');
    console.log('ENCRYPTION_KEY: 16 characters ✅');

    console.log('\n🛡️ Security Checklist - EXPOSED CREDENTIALS:');
    console.log('☐ MongoDB: DELETE user "keshav02" and create new secure user');
    console.log('☐ Gmail: REVOKE password "aecfmmzloctnjmnn" and create new app password');
    console.log('☐ Cloudinary: REGENERATE all keys (Cloud: duceefwa0, Key: 657848115641787)');
    console.log('☐ JWT: NEW strong secret generated automatically (replace weak one)');
    console.log('☐ .gitignore: Updated to protect .env files');
    console.log('☐ Repository: Consider changing repo to private if public');

    console.log('\n📚 Security Best Practices:');
    console.log('1. 🔐 Use dedicated service accounts for production');
    console.log('2. 🔄 Rotate credentials every 90 days');
    console.log('3. 📈 Monitor access logs for suspicious activity');
    console.log('4. 🗺️ Use different credentials for dev/staging/production');
    console.log('5. 🫧 Never share credentials via email or chat');
    console.log('6. 📝 Document security procedures for your team');

    console.log('\n📚 Next Steps:');
    console.log('1. ⚡ URGENT: Rotate all exposed credentials within 24 hours');
    console.log('2. ✏️  Edit server/.env with your NEW secure credentials');
    console.log('3. 🗑️  Remove/secure the old config.env after migration');
    console.log('4. 🧪 Test all functionality with new configuration');
    console.log('5. 🚀 Deploy with secure environment variables');
    console.log('6. 📈 Set up monitoring and alerting for future breaches');

    console.log('\n🎉 Security migration template created successfully!');
    console.log('⚠️  Remember: NEVER commit .env files to git!');
    console.log('🛡️  Your application security depends on immediate credential rotation!');

    // Create additional security documentation
    const securityDocPath = path.join(process.cwd(), 'server', 'SECURITY_INCIDENT_RESPONSE.md');
    const securityDoc = createSecurityIncidentDoc();
    fs.writeFileSync(securityDocPath, securityDoc);
    console.log('\n📝 Created security incident response guide at:', securityDocPath);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

// Run migration
migrate();