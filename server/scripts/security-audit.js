#!/usr/bin/env node

/**
 * Security Audit Script
 * Run this script to check for potential security issues in the application
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

console.log('🔐 LibraFlow Security Audit');
console.log('==========================\n');

// Check 1: Environment file security
console.log('1. Environment File Check');
console.log('------------------------');
const envFiles = ['.env', '.env.development', '.env.production', '.env.test'];
let envFileIssues = [];

envFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const permissions = stats.mode.toString(8).slice(-3);
    
    console.log(`   ${file}: Found (Permissions: ${permissions})`);
    
    // Check if file is readable by others (last digit > 0 for group/others)
    if (parseInt(permissions[2]) > 0 || parseInt(permissions[1]) > 0) {
      envFileIssues.push(`${file} has loose permissions (${permissions})`);
    }
  } else {
    console.log(`   ${file}: Not found`);
  }
});

if (envFileIssues.length > 0) {
  console.log('   ⚠️  Issues found:');
  envFileIssues.forEach(issue => console.log(`      - ${issue}`));
} else {
  console.log('   ✅ No permission issues found');
}

console.log('\n2. Critical Environment Variables Check');
console.log('-------------------------------------');

const criticalVars = [
  'JWT_SECRET_KEY',
  'MONGO_URI',
  'SMTP_PASSWORD',
  'CLOUDINARY_API_SECRET'
];

let missingVars = [];
let weakVars = [];

criticalVars.forEach(varName => {
  const value = process.env[varName];
  
  if (!value) {
    missingVars.push(varName);
    console.log(`   ${varName}: ❌ Missing`);
  } else {
    console.log(`   ${varName}: ✅ Present`);
    
    // Check for weak/default values
    if (value.length < 16 || 
        value.includes('your_') || 
        value.includes('default') ||
        value === 'secret' ||
        value === 'password') {
      weakVars.push(varName);
      console.log(`      ⚠️  Warning: Potentially weak value detected`);
    }
  }
});

if (missingVars.length > 0) {
  console.log('\n   ❌ Missing critical variables:');
  missingVars.forEach(varName => console.log(`      - ${varName}`));
}

if (weakVars.length > 0) {
  console.log('\n   ⚠️  Variables with potentially weak values:');
  weakVars.forEach(varName => console.log(`      - ${varName}`));
}

console.log('\n3. Dependencies Security Check');
console.log('-----------------------------');

// Check for known vulnerable packages
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // Known vulnerable or outdated packages (this is a simplified check)
  const vulnerablePackages = {
    'bcrypt': '>=5.0.0',
    'jsonwebtoken': '>=9.0.0',
    'express': '>=4.18.0'
  };
  
  let vulnIssues = [];
  
  Object.entries(vulnerablePackages).forEach(([pkg, minVersion]) => {
    if (dependencies[pkg]) {
      const currentVersion = dependencies[pkg].replace('^', '').replace('~', '');
      const minVer = minVersion.replace('>=', '');
      
      // Simple version comparison (not comprehensive)
      const currentParts = currentVersion.split('.').map(Number);
      const minParts = minVer.split('.').map(Number);
      
      let isOutdated = false;
      for (let i = 0; i < Math.max(currentParts.length, minParts.length); i++) {
        const curr = currentParts[i] || 0;
        const min = minParts[i] || 0;
        
        if (curr < min) {
          isOutdated = true;
          break;
        } else if (curr > min) {
          break;
        }
      }
      
      if (isOutdated) {
        vulnIssues.push(`${pkg}: Current ${currentVersion}, Recommended ${minVersion}`);
      }
    }
  });
  
  if (vulnIssues.length > 0) {
    console.log('   ⚠️  Outdated packages detected:');
    vulnIssues.forEach(issue => console.log(`      - ${issue}`));
  } else {
    console.log('   ✅ All critical dependencies are up to date');
  }
}

console.log('\n4. File System Security Check');
console.log('----------------------------');

// Check for exposed sensitive files
const sensitiveFiles = [
  'config.env',
  '.env.backup',
  '.env.copy',
  'config.json',
  'secrets.json'
];

let exposedFiles = [];

sensitiveFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    exposedFiles.push(file);
  }
});

if (exposedFiles.length > 0) {
  console.log('   ⚠️  Potentially sensitive files exposed:');
  exposedFiles.forEach(file => console.log(`      - ${file}`));
} else {
  console.log('   ✅ No sensitive files exposed');
}

console.log('\n5. Git Repository Check');
console.log('----------------------');

const gitPath = path.join(__dirname, '..', '.git');
if (fs.existsSync(gitPath)) {
  console.log('   ✅ Git repository detected');
  
  // Check if repository is public (simplified check)
  const gitConfigPath = path.join(gitPath, 'config');
  if (fs.existsSync(gitConfigPath)) {
    const gitConfig = fs.readFileSync(gitConfigPath, 'utf8');
    if (gitConfig.includes('github.com') && !gitConfig.includes('git@github.com')) {
      console.log('   ⚠️  Repository may be public. Ensure sensitive data is not committed.');
    }
  }
} else {
  console.log('   ℹ️  Not a git repository');
}

console.log('\n🔐 Security Audit Complete');
console.log('==========================');

const totalIssues = envFileIssues.length + missingVars.length + weakVars.length + 
                  exposedFiles.length;

if (totalIssues === 0) {
  console.log('✅ No security issues detected!');
} else {
  console.log(`⚠️  ${totalIssues} potential security issues detected.`);
  console.log('Please review the issues above and take appropriate action.');
}

console.log('\n💡 Recommendations:');
console.log('   • Rotate all credentials immediately');
console.log('   • Ensure .env files are in .gitignore');
console.log('   • Use strong, randomly generated secrets');
console.log('   • Keep dependencies up to date');
console.log('   • Regularly run this audit script');