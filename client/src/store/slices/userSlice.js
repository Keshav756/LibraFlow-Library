import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const userSlice = createSlice({
    name: "user",
    initialState: {
        users: [],
        loading: false,
    },
    reducers: {
        fetchAllUsersRequest: (state) => {
            state.loading = true;
        },
        fetchAllUsersSuccess: (state, action) => {
            state.loading = false;
            state.users = action.payload;
        },
        fetchAllUsersFailed: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        addNewAdminRequest: (state) => {
            state.loading = true;
        },
        addNewAdminSuccess: (state, action) => {
            state.loading = false;
        },
        addNewAdminFailed: (state, action) => {
            state.loading = false;
        },
    },
});

export const fetchAllUsers = () => async (dispatch) => {
    dispatch(userSlice.actions.fetchAllUsersRequest());
    await axios.get("http://localhost:4000/api/v1/user/all", {
        withCredentials: true,
    }).then(res => dispatch(userSlice.actions.fetchAllUsersSuccess(res.data.users)))
    .catch(err => dispatch(userSlice.actions.fetchAllUsersFailed(err.response.data.message)));
};

export const addNewAdmin = (user) => async (dispatch) => {
    dispatch(userSlice.actions.addNewAdminRequest());
    await axios.post("http://localhost:4000/api/v1/user/add/new-admin", user, {
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
    });
};

export default userSlice.reducer;