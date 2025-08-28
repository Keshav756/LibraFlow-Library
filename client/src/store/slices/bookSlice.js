import { createSlice } from "@reduxjs/toolkit";
import axiosInstance from "/src/utils/axiosInstance";
import { toggleAddBookPopup, toggleEditBookPopup } from "./popupSlice";
import { toast } from "react-toastify";

const initialState = {
  loading: false,
  error: null,
  message: null,
  books: [],
};

const bookSlice = createSlice({
  name: "book",
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
    setBooks: (state, action) => {
      state.books = action.payload;
    },
    resetBookSlice: () => initialState,
  },
});

export const { requestStart, requestSuccess, requestFailed, setBooks, resetBookSlice } = bookSlice.actions;

// --- Thunks ---
export const fetchAllBooks = () => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axiosInstance.get("/book/all");
    const books = Array.isArray(data) ? data : data.books ?? [];
    dispatch(setBooks(books));
    dispatch(requestSuccess());
  } catch (error) {
    const msg = error.response?.data?.message || "Failed to fetch books";
    toast.error(msg);
    dispatch(requestFailed(msg));
  }
};

export const addBook = (bookData) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axiosInstance.post("/book/admin/add", bookData);
    toast.success(data.message || "Book added successfully");
    dispatch(requestSuccess(data.message));
    dispatch(fetchAllBooks());
    dispatch(toggleAddBookPopup(false));
  } catch (error) {
    const msg = error.response?.data?.message || "Failed to add book";
    toast.error(msg);
    dispatch(requestFailed(msg));
  }
};

export const updateBook = ({ id, updatedData }) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axiosInstance.put(`/book/admin/update/${id}`, updatedData);
    toast.success(data.message || "Book updated successfully");
    dispatch(requestSuccess(data.message));
    dispatch(fetchAllBooks());
    dispatch(toggleEditBookPopup(false));
  } catch (error) {
    const msg = error.response?.data?.message || "Failed to update book";
    toast.error(msg);
    dispatch(requestFailed(msg));
  }
};

export const deleteBook = (id) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axiosInstance.delete(`/book/admin/delete/${id}`);
    toast.success(data.message || "Book deleted successfully");
    dispatch(requestSuccess(data.message));
    dispatch(fetchAllBooks());
  } catch (error) {
    const msg = error.response?.data?.message || "Failed to delete book";
    toast.error(msg);
    dispatch(requestFailed(msg));
  }
};

export default bookSlice.reducer;
