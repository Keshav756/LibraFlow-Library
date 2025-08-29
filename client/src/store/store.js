import { configureStore } from "@reduxjs/toolkit";
import axios from "axios";

import authReducer from "./slices/authSlice";
import popupReducer from "./slices/popupSlice";
import userReducer from "./slices/userSlice";
import bookReducer from "./slices/bookSlice";
import borrowReducer from "./slices/borrowSlice";

// --- Axios defaults ---
axios.defaults.baseURL = "https://libraflow-libraray-management-system.onrender.com/api/v1";
axios.defaults.withCredentials = true;

// Attach token if exists
const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    popup: popupReducer,
    user: userReducer,
    book: bookReducer,
    borrow: borrowReducer,
  },
});
