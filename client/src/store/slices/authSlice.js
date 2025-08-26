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

export const register = (Data) => async (dispatch) => {
  dispatch(authSlice.actions.registerRequest());
  try {
    const res = await axios.post(
      "https://libraflow-library-management-system.onrender.com/api/v1/auth/register",
      Data,
      { withCredentials: true, headers: { "Content-Type": "application/json" } }
    );
    dispatch(authSlice.actions.registerSuccess(res.data));
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Registration failed";
    dispatch(authSlice.actions.registerFailed(errorMessage));
  }
};

export const otpVerification = (email, otp) => async (dispatch) => {
  dispatch(authSlice.actions.otpVerificationRequest());
  try {
    const res = await axios.post(
      "https://libraflow-library-management-system.onrender.com/api/v1/auth/verify-otp",
      { email, otp },
      { withCredentials: true, headers: { "Content-Type": "application/json" } }
    );
    dispatch(authSlice.actions.otpVerificationSuccess(res.data));
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "OTP verification failed";
    dispatch(authSlice.actions.otpVerificationFailed(errorMessage));
  }
};

export const login = (data) => async (dispatch) => {
  dispatch(authSlice.actions.loginRequest());
  try {
    const res = await axios.post(
      "https://libraflow-library-management-system.onrender.com/api/v1/auth/login",
      data,
      { withCredentials: true, headers: { "Content-Type": "application/json" } }
    );
    dispatch(authSlice.actions.loginSuccess(res.data));
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Login failed";
    dispatch(authSlice.actions.loginFailed(errorMessage));
  }
};

export const logout = () => async (dispatch) => {
  dispatch(authSlice.actions.logoutRequest());
  try {
    const res = await axios.get(
      "https://libraflow-library-management-system.onrender.com/api/v1/auth/logout",
      { withCredentials: true }
    );
    dispatch(authSlice.actions.logoutSuccess(res.data.message));
    dispatch(authSlice.actions.resetAuthSlice());
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Logout failed";
    dispatch(authSlice.actions.logoutFailed(errorMessage));
  }
};

export const getUser = () => async (dispatch) => {
  dispatch(authSlice.actions.getUserRequest());
  try {
    const res = await axios.get(
      "https://libraflow-library-management-system.onrender.com/api/v1/auth/me",
      { withCredentials: true, headers: { "Content-Type": "application/json" } }
    );
    dispatch(authSlice.actions.getUserSuccess(res.data));
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Failed to get user";
    dispatch(authSlice.actions.getUserFailed(errorMessage));
  }
};

export const forgotPassword = (email) => async (dispatch) => {
  dispatch(authSlice.actions.forgotPasswordRequest());
  try {
    const res = await axios.post(
      "https://libraflow-library-management-system.onrender.com/api/v1/auth/password/forgot",
      { email },
      { withCredentials: true, headers: { "Content-Type": "application/json" } }
    );
    dispatch(authSlice.actions.forgotPasswordSuccess(res.data));
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Something went wrong";
    dispatch(authSlice.actions.forgotPasswordFailed(errorMessage));
  }
};

export const resetPassword = (data, token) => async (dispatch) => {
  dispatch(authSlice.actions.resetPasswordRequest());
  try {
    const res = await axios.put(
      `https://libraflow-library-management-system.onrender.com/api/v1/auth/password/reset/${token}`,
      data,
      { withCredentials: true, headers: { "Content-Type": "application/json" } }
    );
    dispatch(authSlice.actions.resetPasswordSuccess(res.data));
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Password reset failed";
    dispatch(authSlice.actions.resetPasswordFailed(errorMessage));
  }
};

export const updatePassword = (data) => async (dispatch) => {
  dispatch(authSlice.actions.updatePasswordRequest());
  try {
    const res = await axios.put(
      "https://libraflow-library-management-system.onrender.com/api/v1/auth/password/update",
      data,
      { withCredentials: true, headers: { "Content-Type": "application/json" } }
    );
    dispatch(authSlice.actions.updatePasswordSuccess(res.data));
    return { success: true, data: res.data };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Password update failed";
    dispatch(authSlice.actions.updatePasswordFailed(errorMessage));
    return { error: true, message: errorMessage };
  }
};

export default authSlice.reducer;
