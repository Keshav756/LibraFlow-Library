import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE = "https://libraflow-libraray-management-system.onrender.com/api/v1/user";

// --- Utility: get auth headers ---
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const userSlice = createSlice({
  name: "user",
  initialState: {
    users: [],
    loading: false,
    error: null,
  },
  reducers: {
    fetchAllUsersRequest: (state) => { state.loading = true; },
    fetchAllUsersSuccess: (state, action) => { state.loading = false; state.users = action.payload; },
    fetchAllUsersFailed: (state, action) => { state.loading = false; state.error = action.payload; },
    addNewAdminRequest: (state) => { state.loading = true; },
    addNewAdminSuccess: (state) => { state.loading = false; },
    addNewAdminFailed: (state, action) => { state.loading = false; state.error = action.payload; },
    resetUserSlice: (state) => {
      state.loading = false;
      state.error = null;
      state.message = null;
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
export const fetchAllUsers = () => async (dispatch) => {
  dispatch(fetchAllUsersRequest());
  try {
    const res = await axios.get(`${API_BASE}/all`, { withCredentials: true, headers: getAuthHeaders() });
    dispatch(fetchAllUsersSuccess(res.data.users));
  } catch (error) {
    dispatch(fetchAllUsersFailed(error.response?.data?.message || error.message));
  }
};

export const addNewAdmin = (adminData) => async (dispatch) => {
  dispatch(addNewAdminRequest());
  try {
    const res = await axios.post(`${API_BASE}/add/new-admin`, adminData, {
      withCredentials: true,
      headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
    });
    toast.success(res.data.message || "Admin added successfully");
    dispatch(addNewAdminSuccess());
    dispatch(fetchAllUsers());
    return { success: true, message: res.data.message };
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to add admin";
    toast.error(message);
    dispatch(addNewAdminFailed(message));
    return { error: message };
  }
};

export default userSlice.reducer;
