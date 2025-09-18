import { configureStore } from "@reduxjs/toolkit";
import axios from "axios";

import authReducer from "./slices/authSlice";
import popupReducer from "./slices/popupSlice";
import userReducer from "./slices/userSlice";
import bookReducer from "./slices/bookSlice";
import borrowReducer from "./slices/borrowSlice";
import fineReducer from "./slices/fineSlice"; // Add this line

// --- Axios default setup ---
const BASE_URL = "https://libraflow-library-management-system.onrender.com"; // backend URL
axios.defaults.baseURL = BASE_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common["Content-Type"] = "application/json";

// Automatically attach JWT token from localStorage
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Optional: Handle global responses (401, 403)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized! Logging out...");
      // Optionally, dispatch logout action or clear token
      localStorage.removeItem("token");
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