import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API = "https://libraflow-libraray-management-system.onrender.com/api/v1";

// ✅ Attach token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isLoading: false,
    error: null,
    message: null,
    isAuthenticated: false,
  },
  reducers: {
    requestStart: (state) => {
      state.isLoading = true;
      state.error = null;
      state.message = null;
    },
    requestSuccess: (state, action) => {
      state.isLoading = false;
      state.message = action.payload?.message || null;
      if (action.payload?.user) {
        state.user = action.payload.user;
        state.isAuthenticated = true;
      }
    },
    requestFailed: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logoutSuccess: (state, action) => {
      state.isLoading = false;
      state.message = action.payload;
      state.user = null;
      state.isAuthenticated = false;
    },
    resetAuthSlice: (state) => {
      state.isLoading = false;
      state.error = null;
      state.message = null;
    },
  },
});

export const {
  requestStart,
  requestSuccess,
  requestFailed,
  logoutSuccess,
  resetAuthSlice,
} = authSlice.actions;

// --- Thunks ---
export const register = (data) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const res = await axios.post(`${API}/auth/register`, data);
    dispatch(requestSuccess(res.data));
  } catch (err) {
    dispatch(requestFailed(getErrorMessage(err, "Registration failed")));
  }
};

export const otpVerification = (email, otp) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const res = await axios.post(`${API}/auth/verify-otp`, { email, otp });
    dispatch(requestSuccess(res.data));
  } catch (err) {
    dispatch(requestFailed(getErrorMessage(err, "OTP verification failed")));
  }
};

export const login = (data) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const res = await axios.post(`${API}/auth/login`, data);
    localStorage.setItem("token", res.data.token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`; // ✅ set token globally
    dispatch(requestSuccess(res.data));
  } catch (err) {
    dispatch(requestFailed(getErrorMessage(err, "Login failed")));
  }
};

export const logout = () => async (dispatch) => {
  dispatch(requestStart());
  try {
    const res = await axios.post(`${API}/auth/logout`, {}, getAuthHeaders());
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"]; // ✅ remove token
    dispatch(logoutSuccess(res.data.message));
  } catch (err) {
    dispatch(requestFailed(getErrorMessage(err, "Logout failed")));
  }
};

export const getUser = () => async (dispatch) => {
  dispatch(requestStart());
  try {
    const res = await axios.get(`${API}/auth/me`, getAuthHeaders());
    dispatch(requestSuccess(res.data));
  } catch (err) {
    dispatch(requestFailed(getErrorMessage(err, "Failed to fetch user")));
  }
};

export const forgotPassword = (email) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const res = await axios.post(`${API}/auth/password/forgot`, { email });
    dispatch(requestSuccess(res.data));
  } catch (err) {
    dispatch(requestFailed(getErrorMessage(err, "Failed to send reset link")));
  }
};

export const resetPassword = (data, token) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const res = await axios.put(`${API}/auth/password/reset/${token}`, data);
    dispatch(requestSuccess(res.data));
  } catch (err) {
    dispatch(requestFailed(getErrorMessage(err, "Password reset failed")));
  }
};

export const updatePassword = (data) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const res = await axios.put(`${API}/auth/password/update`, data, getAuthHeaders());
    dispatch(requestSuccess(res.data));
  } catch (err) {
    dispatch(requestFailed(getErrorMessage(err, "Password update failed")));
  }
};

export default authSlice.reducer;
