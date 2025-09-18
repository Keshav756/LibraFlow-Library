import { configureStore } from "@reduxjs/toolkit";
import axios from "axios";

import authReducer from "./slices/authSlice";
import popupReducer from "./slices/popupSlice";
import userReducer from "./slices/userSlice";
import bookReducer from "./slices/bookSlice";
import borrowReducer from "./slices/borrowSlice";
import fineReducer from "./slices/fineSlice"; // Add this line

// --- Axios default setup ---
const BASE_URL = "https://libraflow-library.onrender.com"; // backend URL
axios.defaults.baseURL = BASE_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common["Content-Type"] = "application/json";

// Automatically attach JWT token from localStorage
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  
  // List of endpoints that require authentication
  const protectedEndpoints = ['/auth/me', '/user/all', '/payment/all-payments', '/borrow/admin', '/borrow/my-borrowed-books'];
  const isProtectedRoute = protectedEndpoints.some(endpoint => config.url?.includes(endpoint));
  
  if (isProtectedRoute && !token) {
    // Cancel the request if it's a protected route and no token exists
    return Promise.reject(new Error('No authentication token available'));
  }
  
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle global responses (401, 403, 400 for auth errors)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 400) {
      console.warn("Authentication error! Clearing token...");
      localStorage.removeItem("token");
    }
    
    // Don't log errors for requests that were cancelled due to no token
    if (error.message !== 'No authentication token available') {
      console.error('API Error:', error.response?.data?.message || error.message);
    }
    
    return Promise.reject(error);
  }
);

export const store = configureStore({
  reducer: {
    auth: authReducer,
    popup: popupReducer,
    user: userReducer,
    book: bookReducer,
    borrow: borrowReducer,
    fine: fineReducer, // Add this line
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // allow non-serializable values like Axios errors
    }),
});