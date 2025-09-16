# Testing Credentials

This document provides information about test accounts that can be used for development and testing purposes.

## Test Accounts

### Regular User
- **Email**: testuser@example.com
- **Password**: Test@1234
- **Role**: User

### Admin User
- **Email**: testadmin@example.com
- **Password**: Admin@1234
- **Role**: Admin

## How to Create Test Accounts

Run the following command from the `server` directory:

```bash
npm run create-test-users
```

This will create the test accounts in your database if they don't already exist.

## Password Requirements

All passwords in this system must follow these requirements:
- 8-16 characters long
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

## Usage

These test accounts can be used to:
1. Test login functionality
2. Test role-based access control
3. Test user-specific features
4. Test admin features

Note: These accounts should only be used for development and testing purposes. Do not use them in production environments.