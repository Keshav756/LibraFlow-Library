import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

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
    registerRequest(state) {
      state.isLoading = true;
      state.error = null;
      state.message = null;
    },
    registerSuccess(state, action) {
      state.isLoading = false;
      state.message = action.payload.message;
    },
    registerFailed(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
    otpVerificationRequest(state) {
      state.isLoading = true;
      state.error = null;
      state.message = null;
    },
    otpVerificationSuccess(state, action) {
      state.isLoading = false;
      state.message = action.payload.message;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      // Store token in localStorage
      if (action.payload.token) {
        localStorage.setItem("token", action.payload.token);
      }
    },
    otpVerificationFailed(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
    loginRequest(state) {
      state.isLoading = true;
      state.error = null;
      state.message = null;
    },
    loginSuccess(state, action) {
      state.isLoading = false;
      state.message = action.payload.message;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      // Store token in localStorage
      if (action.payload.token) {
        localStorage.setItem("token", action.payload.token);
      }
    },
    loginFailed(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
    logoutRequest(state) {
      state.isLoading = true;
      state.error = null;
      state.message = null;
    },
    logoutSuccess(state, action) {
      state.isLoading = false;
      state.message = action.payload;
      state.isAuthenticated = false;
      state.user = null;
      // Remove token from localStorage
      localStorage.removeItem("token");
    },
    logoutFailed(state, action) {
      state.isLoading = false;
      state.error = action.payload;
      state.message = null;
    },
    getUserRequest(state) {
      state.isLoading = true;
      state.error = null;
      state.message = null;
    },
    getUserSuccess(state, action) {
      state.isLoading = false;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    getUserFailed(state, action) {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      // Remove invalid token from localStorage
      localStorage.removeItem("token");
    },
    forgotPasswordRequest(state) {
      state.isLoading = true;
      state.error = null;
      state.message = null;
    },
    forgotPasswordSuccess(state, action) {
      state.isLoading = false;
      state.message = action.payload.message;
    },
    forgotPasswordFailed(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
    resetPasswordRequest(state) {
      state.isLoading = true;
      state.error = null;
      state.message = null;
    },
    resetPasswordSuccess(state, action) {
      state.isLoading = false;
      state.message = action.payload.message;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      // Store token in localStorage
      if (action.payload.token) {
        localStorage.setItem("token", action.payload.token);
      }
    },
    resetPasswordFailed(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
    updatePasswordRequest(state) {
      state.isLoading = true;
      state.error = null;
      state.message = null;
    },
    updatePasswordSuccess(state, action) {
      state.isLoading = false;
      state.message = action.payload.message;
    },
    updatePasswordFailed(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
    resetAuthSlice(state) {
      state.isLoading = false;
      state.error = null;
      state.message = null;
      state.isAuthenticated = state.isAuthenticated;
      state.user = state.user;
    },
  },
});

export const resetAuthSlice = () => (dispatch) => {
  dispatch(authSlice.actions.resetAuthSlice());
};

// --- Thunks ---
export const register = (Data) => async (dispatch) => {
  dispatch(authSlice.actions.registerRequest());
  try {
    const res = await axios.post("/auth/register", Data, {
      headers: { "Content-Type": "application/json" },
    });
    dispatch(authSlice.actions.registerSuccess(res.data));
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Registration failed";
    dispatch(authSlice.actions.registerFailed(errorMessage));
  }
};

export const otpVerification = (email, otp) => async (dispatch) => {
  dispatch(authSlice.actions.otpVerificationRequest());
  try {
    const res = await axios.post("/auth/verify-otp", { email, otp }, {
      headers: { "Content-Type": "application/json" },
    });
    dispatch(authSlice.actions.otpVerificationSuccess(res.data));
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "OTP verification failed";
    dispatch(authSlice.actions.otpVerificationFailed(errorMessage));
  }
};

export const login = (data) => async (dispatch) => {
  dispatch(authSlice.actions.loginRequest());
  try {
    const res = await axios.post("/auth/login", data, {
      headers: { "Content-Type": "application/json" },
    });
    dispatch(authSlice.actions.loginSuccess(res.data));
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Login failed";
    dispatch(authSlice.actions.loginFailed(errorMessage));
  }
};

export const logout = () => async (dispatch) => {
  dispatch(authSlice.actions.logoutRequest());
  try {
    const res = await axios.get("/auth/logout");
    dispatch(authSlice.actions.logoutSuccess(res.data.message));
    dispatch(authSlice.actions.resetAuthSlice());
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Logout failed";
    dispatch(authSlice.actions.logoutFailed(errorMessage));
  }
};

export const getUser = () => async (dispatch) => {
  // Check if token exists before making request
  const token = localStorage.getItem("token");
  if (!token) {
    dispatch(authSlice.actions.getUserFailed("No token found"));
    return;
  }

  dispatch(authSlice.actions.getUserRequest());
  try {
    const res = await axios.get("/auth/me");
    dispatch(authSlice.actions.getUserSuccess(res.data));
  } catch (error) {
    // Handle cancelled requests silently
    if (error.cancelled || error.silent) {
      dispatch(authSlice.actions.getUserFailed("Request cancelled"));
      return;
    }
    const errorMessage = error.response?.data?.message || error.message || "Failed to get user";
    dispatch(authSlice.actions.getUserFailed(errorMessage));
  }
};

export const forgotPassword = (email) => async (dispatch) => {
  dispatch(authSlice.actions.forgotPasswordRequest());
  try {
    const res = await axios.post("/auth/password/forgot", { email }, {
      headers: { "Content-Type": "application/json" },
    });
    dispatch(authSlice.actions.forgotPasswordSuccess(res.data));
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Failed to send reset link";
    dispatch(authSlice.actions.forgotPasswordFailed(errorMessage));
  }
};

export const resetPassword = (passwords, token) => async (dispatch) => {
  dispatch(authSlice.actions.resetPasswordRequest());
  try {
    const res = await axios.put(`/auth/password/reset/${token}`, passwords, {
      headers: { "Content-Type": "application/json" },
    });
    dispatch(authSlice.actions.resetPasswordSuccess(res.data));
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Failed to reset password";
    dispatch(authSlice.actions.resetPasswordFailed(errorMessage));
  }
};

export const updatePassword = (passwords) => async (dispatch) => {
  dispatch(authSlice.actions.updatePasswordRequest());
  try {
    const res = await axios.put("/auth/password/update", passwords, {
      headers: { "Content-Type": "application/json" },
    });
    dispatch(authSlice.actions.updatePasswordSuccess(res.data));
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Failed to update password";
    dispatch(authSlice.actions.updatePasswordFailed(errorMessage));
  }
};

export const {
  registerRequest,
  registerSuccess,
  registerFailed,
  otpVerificationRequest,
  otpVerificationSuccess,
  otpVerificationFailed,
  loginRequest,
  loginSuccess,
  loginFailed,
  logoutRequest,
  logoutSuccess,
  logoutFailed,
  getUserRequest,
  getUserSuccess,
  getUserFailed,
  forgotPasswordRequest,
  forgotPasswordSuccess,
  forgotPasswordFailed,
  resetPasswordRequest,
  resetPasswordSuccess,
  resetPasswordFailed,
  updatePasswordRequest,
  updatePasswordSuccess,
  updatePasswordFailed,
  resetAuthSlice: resetAuthSliceAction,
} = authSlice.actions;

export default authSlice.reducer;