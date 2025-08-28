import { createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";

const initialState = {
  users: [],
  loading: false,
  error: null,
  message: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    requestStart: (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    requestSuccess: (state, action) => {
      state.loading = false;
      state.message = action.payload?.message || null;
    },
    requestFailed: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setUsers: (state, action) => {
      state.users = action.payload;
    },
  },
});

export const { requestStart, requestSuccess, requestFailed, setUsers } = userSlice.actions;

// --- Thunks ---
export const fetchAllUsers = () => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axiosInstance.get("/user/all");
    dispatch(setUsers(data.users));
    dispatch(requestSuccess());
  } catch (error) {
    const msg = error.response?.data?.message || "Failed to fetch users";
    toast.error(msg);
    dispatch(requestFailed(msg));
  }
};

export const addNewAdmin = (adminData) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axiosInstance.post("/user/admin/add", adminData);
    toast.success(data.message || "Admin added successfully");
    dispatch(requestSuccess(data.message));
    dispatch(fetchAllUsers());
  } catch (error) {
    const msg = error.response?.data?.message || "Failed to add admin";
    toast.error(msg);
    dispatch(requestFailed(msg));
  }
};

export default userSlice.reducer;
