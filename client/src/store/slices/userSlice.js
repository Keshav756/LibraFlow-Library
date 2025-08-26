import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE = "https://libraflow-library-management-system.onrender.com/api/v1/user";

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
<<<<<<< HEAD
    dispatch(userSlice.actions.fetchAllUsersRequest());
    await axios.get("https://libraflow-library-management-system.onrender.com/api/v1/user/all", {
        withCredentials: true,
    }).then(res => dispatch(userSlice.actions.fetchAllUsersSuccess(res.data.users)))
    .catch(err => dispatch(userSlice.actions.fetchAllUsersFailed(err.response.data.message)));
};

export const addNewAdmin = (user) => async (dispatch) => {
    dispatch(userSlice.actions.addNewAdminRequest());
    await axios.post("https://libraflow-libraray-management-system.onrender.com/api/v1/user/add/new-admin", user, {
        withCredentials: true,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    }).then(res => {
        dispatch(userSlice.actions.addNewAdminSuccess(res.data.admin));
        toast.success(res.data.message);
        // Refresh the users list to show the new admin
        dispatch(fetchAllUsers());
    })
    .catch(err => {
        dispatch(userSlice.actions.addNewAdminFailed(err.response.data.message));
        toast.error(err.response.data.message);
=======
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
>>>>>>> 1730d72 (final commit)
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
