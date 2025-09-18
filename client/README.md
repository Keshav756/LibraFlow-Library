# LibraFlow Client

This is the frontend for the LibraFlow Library Management System, built with React and Vite.

## Features
- User authentication (login, registration, password reset)
- Book catalog browsing
- Borrowing and returning books
- Fine payment system with Razorpay integration
- Admin dashboard for managing books, users, and payments
- Responsive design for all device sizes

## Tech Stack
- React 18
- Vite
- Redux Toolkit for state management
- Tailwind CSS for styling
- React Router for navigation
- Axios for API requests
- Razorpay for payment processing

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
1. Clone the repository
2. Navigate to the client directory: `cd client`
3. Install dependencies: `npm install`

### Running the Application
- Development mode: `npm run dev`
- Production build: `npm run build`
- Preview production build: `npm run preview`

## Payment System
The LibraFlow system includes a complete fine and payment system integrated with Razorpay.

### Features
- Automatic fine calculation for overdue books
- Secure payment processing through Razorpay
- Payment history tracking
- Admin payment dashboard

### Setup
1. Obtain Razorpay API keys from your Razorpay dashboard
2. Configure the server with your Razorpay credentials in `server/config/config.env`:
   ```
   RAZORPAY_KEY_ID=your_key_id
   RAZORPAY_KEY_SECRET=your_key_secret
   ```

### Testing Payments
Use the following test card details for development:
- Card Number: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: 123
- Name: Any name
- OTP: 123456

## Testing Credentials

For development and testing purposes, the server provides test accounts that can be created using the server script:

From the server directory, run:
```bash
npm run create-test-users
```

This will create the following test accounts:

### Regular User
- Email: testuser@example.com
- Password: Test@1234

### Admin User
- Email: testadmin@example.com
- Password: Admin@1234

## Deployment
The client is configured to work with the deployed backend at:
- Server: https://libraflow-library.onrender.com
- Client: https://libraflow-library.netlify.app

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License
This project is licensed under the MIT License.