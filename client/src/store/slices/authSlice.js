import { createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";

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
      state.message = action.payload || null;
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

export const { requestStart, requestSuccess, requestFailed, logoutSuccess, resetAuthSlice } = authSlice.actions;

// --- Thunks ---
export const register = (data) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const res = await axiosInstance.post("/auth/register", data);
    toast.success(res.data.message || "Registered successfully");
    dispatch(requestSuccess(res.data));
  } catch (error) {
    const msg = error.response?.data?.message || "Registration failed";
    toast.error(msg);
    dispatch(requestFailed(msg));
  }
};

export const otpVerification = (email, otp) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const res = await axiosInstance.post("/auth/verify-otp", { email, otp });
    toast.success(res.data.message || "OTP verified successfully");
    dispatch(requestSuccess(res.data));
  } catch (error) {
    const msg = error.response?.data?.message || "OTP verification failed";
    toast.error(msg);
    dispatch(requestFailed(msg));
  }
};

export const login = (data) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const res = await axiosInstance.post("/auth/login", data);
    toast.success(res.data.message || "Login successful");
    dispatch(requestSuccess(res.data));
  } catch (error) {
    const msg = error.response?.data?.message || "Login failed";
    toast.error(msg);
    dispatch(requestFailed(msg));
  }
};

export const logout = () => async (dispatch) => {
  dispatch(requestStart());
  try {
    const res = await axiosInstance.get("/auth/logout");
    toast.success(res.data.message || "Logged out successfully");
    dispatch(logoutSuccess(res.data.message));
    dispatch(resetAuthSlice());
  } catch (error) {
    const msg = error.response?.data?.message || "Logout failed";
    toast.error(msg);
    dispatch(requestFailed(msg));
  }
};

export const getUser = () => async (dispatch) => {
  dispatch(requestStart());
  try {
    const res = await axiosInstance.get("/auth/me");
    dispatch(requestSuccess(res.data));
  } catch (error) {
    const msg = error.response?.data?.message || "Failed to get user";
    toast.error(msg);
    dispatch(requestFailed(msg));
  }
};

export const forgotPassword = (email) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const res = await axiosInstance.post("/auth/password/forgot", { email });
    toast.success(res.data.message || "Password reset email sent");
    dispatch(requestSuccess(res.data));
  } catch (error) {
    const msg = error.response?.data?.message || "Something went wrong";
    toast.error(msg);
    dispatch(requestFailed(msg));
  }
};

export const resetPassword = (data, token) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const res = await axiosInstance.put(`/auth/password/reset/${token}`, data);
    toast.success(res.data.message || "Password reset successfully");
    dispatch(requestSuccess(res.data));
  } catch (error) {
    const msg = error.response?.data?.message || "Password reset failed";
    toast.error(msg);
    dispatch(requestFailed(msg));
  }
};

export const updatePassword = (data) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const res = await axiosInstance.put("/auth/password/update", data);
    toast.success(res.data.message || "Password updated successfully");
    dispatch(requestSuccess(res.data));
    return { success: true, data: res.data };
  } catch (error) {
    const msg = error.response?.data?.message || "Password update failed";
    toast.error(msg);
    dispatch(requestFailed(msg));
    return { error: true, message: msg };
  }
};

export default authSlice.reducer;
