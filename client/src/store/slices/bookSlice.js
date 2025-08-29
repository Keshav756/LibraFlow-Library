import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import { toggleAddBookPopup, toggleEditBookPopup } from "./popupSlice";

// ✅ Always use full API URL
const API_BASE = "https://libraflow-libraray-management-system.onrender.com/api/v1/book";

// ✅ Attach token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const initialState = {
  books: [],
  loading: false,
  error: null,
  message: null,
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

export const { requestStart, requestSuccess, requestFailed, setBooks, resetBookSlice } =
  bookSlice.actions;

// --- Thunks ---
export const fetchAllBooks = () => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axios.get(`${API_BASE}/all`, getAuthHeaders());
    dispatch(setBooks(Array.isArray(data) ? data : data.books ?? []));
    dispatch(requestSuccess());
  } catch (err) {
    const message = getErrorMessage(err, "Failed to fetch books");
    toast.error(message);
    dispatch(requestFailed(message));
  }
};

export const addBook = (bookData) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axios.post(`${API_BASE}/admin/add`, bookData, getAuthHeaders());
    toast.success(data.message || "Book added");
    dispatch(requestSuccess(data.message));
    dispatch(fetchAllBooks());
    dispatch(toggleAddBookPopup(false));
  } catch (err) {
    const message = getErrorMessage(err, "Failed to add book");
    toast.error(message);
    dispatch(requestFailed(message));
  }
};

export const updateBook = ({ id, updatedData }) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axios.put(
      `${API_BASE}/admin/update/${id}`,
      updatedData,
      getAuthHeaders()
    );
    toast.success(data.message || "Book updated");
    dispatch(requestSuccess(data.message));
    dispatch(fetchAllBooks());
    dispatch(toggleEditBookPopup(false));
  } catch (err) {
    const message = getErrorMessage(err, "Failed to update book");
    toast.error(message);
    dispatch(requestFailed(message));
  }
};

export const deleteBook = (id) => async (dispatch) => {
  dispatch(requestStart());
  try {
    const { data } = await axios.delete(`${API_BASE}/admin/delete/${id}`, getAuthHeaders());
    toast.success(data.message || "Book deleted");
    dispatch(requestSuccess(data.message));
    dispatch(fetchAllBooks());
  } catch (err) {
    const message = getErrorMessage(err, "Failed to delete book");
    toast.error(message);
    dispatch(requestFailed(message));
  }
};

export default bookSlice.reducer;
