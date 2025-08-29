import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE = "/api/v1/user";
const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const userSlice = createSlice({
  name: "user",
  initialState: { users: [], loading: false, error: null },
  reducers: {
    requestStart: (state) => { state.loading = true; state.error = null; },
    requestSuccess: (state) => { state.loading = false; },
    requestFailed: (state, action) => { state.loading = false; state.error = action.payload; },
    setUsers: (state, action) => { state.users = action.payload; },
  },
});

export const { requestStart, requestSuccess, requestFailed, setUsers } = userSlice.actions;

// --- Thunks ---
export const fetchAllUsers = () => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axios.get(`${API_BASE}/all`);
    dispatch(setUsers(data.users));
    dispatch(requestSuccess());
  } catch (err) {
    dispatch(requestFailed(getErrorMessage(err, "Failed to fetch users")));
  }
};

export const addNewAdmin = (adminData) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axios.post(`${API_BASE}/admin/add`, adminData);
    toast.success(data.message || "Admin added");
    dispatch(requestSuccess());
    dispatch(fetchAllUsers());
  } catch (err) {
    const message = getErrorMessage(err, "Failed to add admin");
    toast.error(message);
    dispatch(requestFailed(message));
  }
};

export default userSlice.reducer;
