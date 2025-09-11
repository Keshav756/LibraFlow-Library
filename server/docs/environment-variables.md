# Environment Variables Configuration

## Overview
This document describes the environment variables required to run the LibraFlow Library Management System.

## Server Environment Variables (.env)

### Server Configuration
```env
PORT=4000
NODE_ENV=development
```

### Database Configuration
```env
MONGO_URI=your-mongodb-connection-string
DB_NAME=LibraFlow_Library_Management_System
```

### JWT Authentication
```env
JWT_SECRET_KEY=your-jwt-secret-key
JWT_EXPIRE=7d
```

### Frontend URL
```env
FRONTEND_URL=https://libraflow-library-management-system.netlify.app/
```

### Email/SMTP Configuration
```env
SMTP_HOST=smtp.gmail.com
SMTP_SERVICE=gmail
SMTP_PORT=465
SMTP_MAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
COOKIE_EXPIRE=3
```

### Cloudinary Configuration
```env
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### Security Settings
```env
ALLOWED_ORIGINS=http://localhost:5173,https://libraflow-library-management-system.netlify.app/
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=your-session-secret
ENCRYPTION_KEY=your-encryption-key
```

### Razorpay Configuration
```env
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

## Client Environment Variables (.env)

### API Configuration
```env
VITE_API_BASE_URL=https://libraflow-library-management-system.onrender.com/api/v1
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id
```

## Setup Instructions

1. **Server Setup**:
   - Copy `.env.example` to `.env` in the server directory
   - Replace all placeholder values with your actual credentials
   - Never commit the `.env` file to version control

2. **Client Setup**:
   - Create a `.env` file in the client directory
   - Add the required variables as shown above
   - Use test keys for development and live keys for production

## Security Notes

- **Never** commit `.env` files to version control
- Use strong, randomly generated secrets for JWT, session, and encryption keys
- Rotate exposed credentials immediately
- Use test keys for development and live keys for production
- Regularly update your API keys and secrets

## Razorpay Keys

### Test Keys (for development)
- Key ID: `rzp_test_JTA2gns76PnMtx`
- Key Secret: `jKigMEhj9d4hCxKee4JkuVRO`

### Live Keys (for production)
- Obtain from your Razorpay dashboard
- Replace the test keys with live keys in production environment