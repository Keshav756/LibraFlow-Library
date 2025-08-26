import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toggleAddBookPopup, toggleEditBookPopup } from "./popupSlice";
import { toast } from "react-toastify";

const API_BASE = "https://libraflow-libraray-management-system.onrender.com/api/v1/book";

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

// Auth headers utility
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- Thunks ---

export const fetchAllBooks = () => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axios.get(`${API_BASE}/all`, {
      withCredentials: true,
      headers: getAuthHeaders(),
    });
    const books = Array.isArray(data) ? data : data.books ?? [];
    dispatch(setBooks(books));
    dispatch(requestSuccess());
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to fetch books";
    toast.error(message);
    dispatch(requestFailed(message));
  }
};

export const addBook = (bookData) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axios.post(`${API_BASE}/admin/add`, bookData, {
      withCredentials: true,
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    });
    toast.success(data.message || "Book added successfully");
    dispatch(requestSuccess(data.message));
    dispatch(fetchAllBooks());
    dispatch(toggleAddBookPopup(false));
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to add book";
    toast.error(message);
    dispatch(requestFailed(message));
  }
};

export const updateBook = ({ id, updatedData }) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axios.put(`${API_BASE}/admin/update/${id}`, updatedData, {
      withCredentials: true,
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    });
    toast.success(data.message || "Book updated successfully");
    dispatch(requestSuccess(data.message));
    dispatch(fetchAllBooks());
    dispatch(toggleEditBookPopup(false));
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to update book";
    toast.error(message);
    dispatch(requestFailed(message));
    throw error;
  }
};

export const deleteBook = (id) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axios.delete(`${API_BASE}/admin/delete/${id}`, {
      withCredentials: true,
      headers: getAuthHeaders(),
    });
    toast.success(data.message || "Book deleted successfully");
    dispatch(requestSuccess(data.message));
    dispatch(fetchAllBooks());
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to delete book";
    toast.error(message);
    dispatch(requestFailed(message));
  }
};

export default bookSlice.reducer;
