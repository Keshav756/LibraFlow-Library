# LibraFlow Server

This is the backend for the LibraFlow Library Management System, built with Node.js and Express.

## Features
- User authentication (registration, login, password reset)
- Book management (CRUD operations)
- Borrowing and returning books
- Fine calculation and payment processing
- Admin dashboard APIs
- Email notifications
- Database management with MongoDB

## Tech Stack
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing
- Nodemailer for email notifications
- Razorpay for payment processing
- Cloudinary for image uploads (optional)

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB database
- npm or yarn

### Installation
1. Clone the repository
2. Navigate to the server directory: `cd server`
3. Install dependencies: `npm install`

### Environment Variables
Create a `config/config.env` file with the following variables:

```env
PORT=4001
FRONTEND_URL=https://libraflow-library-management-system.netlify.app

# Database
DB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET_KEY=your_jwt_secret_key
JWT_EXPIRE=7d

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Running the Application
- Development mode: `npm run dev`
- Production mode: `npm start`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/verify-otp` - OTP verification
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/forgot-password` - Forgot password
- `PUT /api/v1/auth/reset-password/:token` - Reset password
- `PUT /api/v1/auth/update-password` - Update password

### Books
- `GET /api/v1/book/all` - Get all books
- `POST /api/v1/book/admin/add` - Add a new book (Admin only)
- `PUT /api/v1/book/admin/update/:id` - Update a book (Admin only)
- `DELETE /api/v1/book/admin/delete/:id` - Delete a book (Admin only)

### Users
- `GET /api/v1/user/all` - Get all users (Admin only)
- `POST /api/v1/user/add/new-admin` - Add a new admin (Admin only)

### Borrowing
- `POST /api/v1/borrow/record-borrow-book/:id` - Record borrowed book (Admin only)
- `GET /api/v1/borrow/admin/borrowed-books` - List all borrowed books (Admin only)
- `GET /api/v1/borrow/my-borrowed-books` - User's borrowed books
- `PUT /api/v1/borrow/return-borrow-book/:bookId` - Return a borrowed book

### Payments
- `POST /api/v1/payment/create-order` - Create Razorpay order
- `POST /api/v1/payment/verify-payment` - Verify Razorpay payment
- `GET /api/v1/payment/my-payments` - Get user's payment history
- `GET /api/v1/payment/all-payments` - Get all payments (Admin only)

## Payment System
The LibraFlow system includes a complete fine and payment system integrated with Razorpay.

### Features
- Automatic fine calculation for overdue books
- Secure payment processing through Razorpay
- Payment history tracking
- Admin payment dashboard

### Setup
1. Obtain Razorpay API keys from your Razorpay dashboard
2. Configure the server with your Razorpay credentials in `config/config.env`

### Testing Payments
Use the following test card details for development:
- Card Number: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: 123
- Name: Any name
- OTP: 123456

## Deployment
The server is configured to run on port 4001 and is deployed on Render at:
https://libraflow-libraray-management-system.onrender.com

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License
This project is licensed under the MIT License.