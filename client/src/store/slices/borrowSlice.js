import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE =
  "https://libraflow-libraray-management-system.onrender.com/api/v1/borrow";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const getErrorMessage = (error, defaultMsg) =>
  error.response?.data?.message || error.message || defaultMsg;

const borrowSlice = createSlice({
  name: "borrow",
  initialState: {
    loading: false,
    error: null,
    userBorrowedBooks: [],
    allBorrowedBooks: [],
    message: null,
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
export const fetchUserBorrowedBooks = (email) => async (dispatch) => {
  dispatch(fetchUserBorrowedBooksRequest());
  try {
    const query = email ? `?email=${email}` : '';
    const res = await axios.get(`${API_BASE}/my-borrowed-books${query}`, getAuthHeaders());
    dispatch(fetchUserBorrowedBooksSuccess(res.data.borrowedBooks));
  } catch (error) {
    dispatch(fetchUserBorrowedBooksFailed(getErrorMessage(error, "Failed to fetch borrowed books")));
  }
};

export const recordBorrowBook = (email, bookId) => async (dispatch) => {
  if (!bookId) return dispatch(recordBookFailed("Book ID is required"));
  dispatch(recordBookRequest());
  try {
    const res = await axios.post(`${API_BASE}/record-borrow-book/${bookId}`, { email }, getAuthHeaders());
    dispatch(recordBookSuccess(res.data.message));
    dispatch(fetchUserBorrowedBooks(email));
  } catch (error) {
    dispatch(recordBookFailed(getErrorMessage(error, "Failed to borrow book")));
  }
};

export const returnBorrowBook = (email, bookId) => async (dispatch) => {
  if (!bookId) return dispatch(returnBookFailed("Book ID is required"));
  dispatch(returnBookRequest());
  try {
    const res = await axios.put(`${API_BASE}/return-borrow-book/${bookId}`, { email }, getAuthHeaders());
    dispatch(returnBookSuccess(res.data.message));
    dispatch(fetchUserBorrowedBooks(email));
  } catch (error) {
    dispatch(returnBookFailed(getErrorMessage(error, "Failed to return book")));
  }
};

export const fetchAllBorrowedBooks = () => async (dispatch) => {
  dispatch(fetchAllBorrowedBooksRequest());
  try {
    const res = await axios.get(`${API_BASE}/admin/borrowed-books`, getAuthHeaders());
    dispatch(fetchAllBorrowedBooksSuccess(res.data.borrowedBooks));
  } catch (error) {
    dispatch(fetchAllBorrowedBooksFailed(getErrorMessage(error, "Failed to fetch all borrowed books")));
  }
};

export default borrowSlice.reducer;
