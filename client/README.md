# LibraFlow Client

This is the frontend application for the LibraFlow Library Management System.

## Technologies Used

- React.js
- Redux Toolkit
- Tailwind CSS
- Axios
- Framer Motion
- React Router
- React Toastify

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with the following content:
   ```env
   VITE_API_BASE_URL=https://libraflow-libraray-management-system.onrender.com/api/v1
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/        # React components
├── layout/           # Layout components (Header, Sidebar)
├── pages/            # Page components
├── popups/           # Popup components
├── store/            # Redux store and slices
├── config/           # Configuration files
├── assets/           # Static assets (images, icons)
├── App.jsx           # Main App component
├── main.jsx          # Entry point
└── index.css         # Global styles
```

## Environment Variables

- `VITE_API_BASE_URL`: The base URL for the backend API

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run lint`: Run ESLint
- `npm run preview`: Preview the production build

## API Integration

The application uses a centralized API configuration located in `src/config/api.js` to manage all API endpoints. This makes it easier to update endpoints and manage different environments.