import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = "https://libraflow-libraray-management-system.onrender.com/api/v1/borrow"; // full backend URL

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
    fetchUserBorrowedBooksRequest: (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    fetchUserBorrowedBooksSuccess: (state, action) => {
      state.loading = false;
      state.userBorrowedBooks = action.payload;
    },
    fetchUserBorrowedBooksFailed: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    recordBookRequest: (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    recordBookSuccess: (state, action) => {
      state.loading = false;
      state.message = action.payload;
    },
    recordBookFailed: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.message = null;
    },
    fetchAllBorrowedBooksRequest: (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    fetchAllBorrowedBooksSuccess: (state, action) => {
      state.loading = false;
      state.allBorrowedBooks = action.payload;
    },
    fetchAllBorrowedBooksFailed: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.message = null;
    },
    returnBookRequest: (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    returnBookSuccess: (state, action) => {
      state.loading = false;
      state.message = action.payload;
    },
    returnBookFailed: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.message = null;
    },
    resetBorrowSlice: (state) => {
      state.loading = false;
      state.error = null;
      state.message = null;
    },
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
    const res = await axios.get(`${API_BASE}/my-borrowed-books`, {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });
    dispatch(fetchUserBorrowedBooksSuccess(res.data.borrowedBooks));
  } catch (error) {
    dispatch(
      fetchUserBorrowedBooksFailed(error.response?.data?.message || error.message)
    );
  }
};

export const fetchAllBorrowedBooks = () => async (dispatch) => {
  dispatch(fetchAllBorrowedBooksRequest());
  try {
    const res = await axios.get(`${API_BASE}/admin/borrowed-books`, {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });
    dispatch(fetchAllBorrowedBooksSuccess(res.data.borrowedBooks));
  } catch (error) {
    dispatch(
      fetchAllBorrowedBooksFailed(error.response?.data?.message || error.message)
    );
  }
};

export const recordBorrowBook = (email, bookId) => async (dispatch) => {
  dispatch(recordBookRequest());
  try {
    const res = await axios.post(
      `${API_BASE}/record-borrow-book/${bookId}`,
      { email },
      { withCredentials: true, headers: { "Content-Type": "application/json" } }
    );
    dispatch(recordBookSuccess(res.data.message));
    dispatch(fetchUserBorrowedBooks());
  } catch (error) {
    dispatch(recordBookFailed(error.response?.data?.message || error.message));
  }
};

export const returnBorrowBook = (email, bookId) => async (dispatch) => {
  dispatch(returnBookRequest());
  try {
    const res = await axios.put(
      `${API_BASE}/return-borrow-book/${bookId}`,
      { email },
      { withCredentials: true, headers: { "Content-Type": "application/json" } }
    );
    dispatch(returnBookSuccess(res.data.message));
    dispatch(fetchUserBorrowedBooks());
  } catch (error) {
    dispatch(returnBookFailed(error.response?.data?.message || error.message));
  }
};

export default borrowSlice.reducer;
