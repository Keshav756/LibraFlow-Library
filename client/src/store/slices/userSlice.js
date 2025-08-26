import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE = "https://libraflow-libraray-management-system.onrender.com/api/v1/user";

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
  },
});

export const {
  fetchAllUsersRequest,
  fetchAllUsersSuccess,
  fetchAllUsersFailed,
  addNewAdminRequest,
  addNewAdminSuccess,
  addNewAdminFailed,
} = userSlice.actions;

// --- Thunks ---
export const fetchAllUsers = () => async (dispatch) => {
  dispatch(fetchAllUsersRequest());
  try {
    const res = await axios.get(`${API_BASE}/all`, { withCredentials: true });
    dispatch(fetchAllUsersSuccess(res.data.users));
  } catch (err) {
    dispatch(fetchAllUsersFailed(err.response?.data?.message || err.message));
  }
};

export const addNewAdmin = (user) => async (dispatch) => {
  dispatch(addNewAdminRequest());
  try {
    const res = await axios.post(`${API_BASE}/add/new-admin`, user, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });
    dispatch(addNewAdminSuccess());
    toast.success(res.data.message);
    dispatch(fetchAllUsers());
  } catch (err) {
    dispatch(addNewAdminFailed(err.response?.data?.message || err.message));
    toast.error(err.response?.data?.message || err.message);
  }
};

export default userSlice.reducer;
