// client/src/store/slices/borrowSlice.js
import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = "https://libraflow-libraray-management-system.onrender.com/api/v1/borrow";

// Axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || "Something went wrong";

const borrowSlice = createSlice({
  name: "borrow",
  initialState: {
    loading: false,
    error: null,
    message: null,
    userBorrowedBooks: [],
    allBorrowedBooks: [],
  },
  reducers: {
    fetchUserBorrowedBooksRequest: (state) => { state.loading = true; state.error = null; state.message = null; },
    fetchUserBorrowedBooksSuccess: (state, action) => { state.loading = false; state.userBorrowedBooks = action.payload; },
    fetchUserBorrowedBooksFailed: (state, action) => { state.loading = false; state.error = action.payload; },

    recordBookRequest: (state) => { state.loading = true; state.error = null; state.message = null; },
    recordBookSuccess: (state, action) => { state.loading = false; state.message = action.payload; },
    recordBookFailed: (state, action) => { state.loading = false; state.error = action.payload; state.message = null; },

    fetchAllBorrowedBooksRequest: (state) => { state.loading = true; state.error = null; state.message = null; },
    fetchAllBorrowedBooksSuccess: (state, action) => { state.loading = false; state.allBorrowedBooks = action.payload; },
    fetchAllBorrowedBooksFailed: (state, action) => { state.loading = false; state.error = action.payload; state.message = null; },

    returnBookRequest: (state) => { state.loading = true; state.error = null; state.message = null; },
    returnBookSuccess: (state, action) => { state.loading = false; state.message = action.payload; },
    returnBookFailed: (state, action) => { state.loading = false; state.error = action.payload; state.message = null; },

    resetBorrowSlice: (state) => { state.loading = false; state.error = null; state.message = null; },
  },
});

export const {
  fetchUserBorrowedBooksRequest,
  fetchUserBorrowedBooksSuccess,
  fetchUserBorrowedBooksFailed,
  recordBookRequest,
  recordBookSuccess,
  recordBookFailed,
  fetchAllBorrowedBooksRequest,
  fetchAllBorrowedBooksSuccess,
  fetchAllBorrowedBooksFailed,
  returnBookRequest,
  returnBookSuccess,
  returnBookFailed,
  resetBorrowSlice,
} = borrowSlice.actions;

// --- Thunks ---

export const fetchUserBorrowedBooks = () => async (dispatch) => {
  dispatch(fetchUserBorrowedBooksRequest());
  try {
    const res = await axiosInstance.get("/my-borrowed-books");
    dispatch(fetchUserBorrowedBooksSuccess(res.data.borrowedBooks));
  } catch (error) {
    dispatch(fetchUserBorrowedBooksFailed(getErrorMessage(error)));
  }
};

export const fetchAllBorrowedBooks = () => async (dispatch) => {
  dispatch(fetchAllBorrowedBooksRequest());
  try {
    const res = await axiosInstance.get("/admin/borrowed-books");
    dispatch(fetchAllBorrowedBooksSuccess(res.data.borrowedBooks));
  } catch (error) {
    dispatch(fetchAllBorrowedBooksFailed(getErrorMessage(error)));
  }
};

export const recordBorrowBook = ({ email, bookId }) => async (dispatch) => {
  dispatch(recordBookRequest());
  try {
    const res = await axiosInstance.post(`/record-borrow-book/${bookId}`, { email });
    dispatch(recordBookSuccess(res.data.message));
    dispatch(fetchUserBorrowedBooks());
  } catch (error) {
    dispatch(recordBookFailed(getErrorMessage(error)));
  }
};

export const returnBorrowBook = ({ email, bookId }) => async (dispatch) => {
  dispatch(returnBookRequest());
  try {
    const res = await axiosInstance.put(`/return-borrow-book/${bookId}`, { email });
    dispatch(returnBookSuccess(res.data.message));
    dispatch(fetchUserBorrowedBooks());
  } catch (error) {
    dispatch(returnBookFailed(getErrorMessage(error)));
  }
};

export default borrowSlice.reducer;
