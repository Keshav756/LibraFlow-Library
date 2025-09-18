// client/src/store/slices/userSlice.js
import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE = "https://libraflow-library.onrender.com/api/v1/user";

// --- Utility: get auth headers ---
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const userSlice = createSlice({
  name: "user",
  initialState: {
    users: [],
    fetchLoading: false, // For fetching all users
    adminLoading: false, // For adding a new admin
    error: null,
  },
  reducers: {
    // --- Fetch all users ---
    fetchAllUsersRequest: (state) => {
      state.fetchLoading = true;
      state.error = null;
    },
    fetchAllUsersSuccess: (state, action) => {
      state.fetchLoading = false;
      state.users = action.payload;
    },
    fetchAllUsersFailed: (state, action) => {
      state.fetchLoading = false;
      state.error = action.payload;
    },

    // --- Add new admin ---
    addNewAdminRequest: (state) => {
      state.adminLoading = true;
      state.error = null;
    },
    addNewAdminSuccess: (state) => {
      state.adminLoading = false;
    },
    addNewAdminFailed: (state, action) => {
      state.adminLoading = false;
      state.error = action.payload;
    },

    // --- Reset slice ---
    resetUserSlice: (state) => {
      state.fetchLoading = false;
      state.adminLoading = false;
      state.error = null;
    },
  },
});

export const {
  fetchAllUsersRequest,
  fetchAllUsersSuccess,
  fetchAllUsersFailed,
  addNewAdminRequest,
  addNewAdminSuccess,
  addNewAdminFailed,
  resetUserSlice,
} = userSlice.actions;

// --- Thunks ---
// Fetch all users
export const fetchAllUsers = () => async (dispatch) => {
  dispatch(fetchAllUsersRequest());
  try {
    const res = await axios.get(`${API_BASE}/all`, {
      withCredentials: true,
      headers: getAuthHeaders(),
    });
    dispatch(fetchAllUsersSuccess(res.data.users));
  } catch (error) {
    // Handle cancelled requests silently
    if (error.cancelled || error.silent) {
      return;
    }
    dispatch(
 
};

  // Add a new admin
  export const addNewAdmin = (adminData) => async (dispatch) => {
    dispatch(addNewAdminRequest());
    try {
      const res = await axios.post(`${API_BASE}/add/new-admin`, adminData, {
        withCredentials: true,
        headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
      });
      toast.success(res.data.message || "Admin added successfully");
      dispatch(addNewAdminSuccess());
      dispatch(fetchAllUsers()); // refresh list after adding admin
      return { success: true, message: res.data.message };
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to add admin";
      toast.error(message);
      dispatch(addNewAdminFailed(message));
      return { error: message };
    }
  };

  export default userSlice.reducer;