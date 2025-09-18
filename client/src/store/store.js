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

// Automatically attach JWT token from localStorage and block unauthorized requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  // List of endpoints that require authentication
  const protectedEndpoints = [
    '/auth/me',
    '/auth/logout',
    '/user/all',
    '/user/add',
    '/payment/all-payments',
    '/payment/my-payments',
    '/borrow/admin',
    '/borrow/my-borrowed-books',
    '/borrow/record-borrow-book',
    '/borrow/return-borrow-book'
  ];

  const fullUrl = config.url || '';
  const isProtectedRoute = protectedEndpoints.some(endpoint => fullUrl.includes(endpoint));

  if (isProtectedRoute && !token) {
    // Cancel the request immediately - don't even send it
    const cancelledError = new Error('CANCELLED_NO_TOKEN');
    cancelledError.cancelled = true;
    return Promise.reject(cancelledError);
  }

  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle global responses and cancelled requests
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle cancelled requests silently
    if (error.cancelled || error.message === 'CANCELLED_NO_TOKEN') {
      return Promise.reject({ cancelled: true, silent: true });
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.warn("Unauthorized! Clearing token...");
      localStorage.removeItem("token");
      // Redirect to login or refresh page
      window.location.reload();
    }

    // Log other API errors (but not 400s from missing auth)
    if (error.response && error.response.status !== 400) {
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