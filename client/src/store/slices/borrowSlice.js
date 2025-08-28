import { createSlice } from "@reduxjs/toolkit";
import axiosInstance from "/src/utils/axiosInstance";
import { toast } from "react-toastify";

const initialState = {
  loading: false,
  error: null,
  message: null,
  userBorrowedBooks: [],
  allBorrowedBooks: [],
};

const borrowSlice = createSlice({
  name: "borrow",
  initialState,
  reducers: {
    requestStart: (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    requestSuccess: (state, action) => {
      state.loading = false;
      state.message = action.payload || null;
    },
    requestFailed: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setUserBorrowedBooks: (state, action) => {
      state.userBorrowedBooks = action.payload;
    },
    setAllBorrowedBooks: (state, action) => {
      state.allBorrowedBooks = action.payload;
    },
    resetBorrowSlice: () => initialState,
  },
});

export const {
  requestStart,
  requestSuccess,
  requestFailed,
  setUserBorrowedBooks,
  setAllBorrowedBooks,
  resetBorrowSlice,
} = borrowSlice.actions;

// --- Thunks ---
export const fetchUserBorrowedBooks = () => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axiosInstance.get("/borrow/my-borrowed-books");
    dispatch(setUserBorrowedBooks(data.borrowedBooks));
    dispatch(requestSuccess());
  } catch (error) {
    const msg = error.response?.data?.message || "Failed to fetch borrowed books";
    toast.error(msg);
    dispatch(requestFailed(msg));
  }
};

export const fetchAllBorrowedBooks = () => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axiosInstance.get("/borrow/admin/borrowed-books");
    dispatch(setAllBorrowedBooks(data.borrowedBooks));
    dispatch(requestSuccess());
  } catch (error) {
    const msg = error.response?.data?.message || "Failed to fetch all borrowed books";
    toast.error(msg);
    dispatch(requestFailed(msg));
  }
};

export const recordBorrowBook = (email, bookId) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axiosInstance.post(`/borrow/record-borrow-book/${bookId}`, { email });
    toast.success(data.message || "Book borrowed successfully");
    dispatch(requestSuccess(data.message));
    dispatch(fetchUserBorrowedBooks());
  } catch (error) {
    const msg = error.response?.data?.message || "Failed to record borrow";
    toast.error(msg);
    dispatch(requestFailed(msg));
  }
};

export const returnBorrowBook = (email, bookId) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axiosInstance.put(`/borrow/return-borrow-book/${bookId}`, { email });
    toast.success(data.message || "Book returned successfully");
    dispatch(requestSuccess(data.message));
    dispatch(fetchUserBorrowedBooks());
  } catch (error) {
    const msg = error.response?.data?.message || "Failed to return book";
    toast.error(msg);
    dispatch(requestFailed(msg));
  }
};

export default borrowSlice.reducer;
