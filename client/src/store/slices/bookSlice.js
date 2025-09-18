// client/src/store/slices/bookSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE = "https://libraflow-library-management-system.onrender.com/api/v1/book";

// --- Utility: get auth headers ---
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- Async thunks ---
export const fetchAllBooks = createAsyncThunk(
  "books/fetchAllBooks",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API_BASE}/all`, {
        withCredentials: true,
        headers: getAuthHeaders(),
      });
      const books = Array.isArray(data) ? data : data.books ?? [];
      return books;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch books");
    }
  }
);

export const addBook = createAsyncThunk(
  "books/addBook",
  async (bookData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${API_BASE}/admin/add`, bookData, {
        withCredentials: true,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      toast.success(data.message || "Book added successfully");
      // Return book object and message safely
      return { book: data.book ?? data, message: data.message ?? "Book added successfully" };
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to add book";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateBook = createAsyncThunk(
  "books/updateBook",
  async ({ id, updatedData }, { rejectWithValue }) => {
    try {
      const { data } = await axios.put(`${API_BASE}/admin/update/${id}`, updatedData, {
        withCredentials: true,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      toast.success(data.message || "Book updated successfully");
      return { book: data.book ?? data, message: data.message ?? "Book updated successfully" };
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to update book";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteBook = createAsyncThunk(
  "books/deleteBook",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axios.delete(`${API_BASE}/admin/delete/${id}`, {
        withCredentials: true,
        headers: getAuthHeaders(),
      });
      toast.success(data.message || "Book deleted successfully");
      return { id, message: data.message ?? "Book deleted successfully" };
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to delete book";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// --- Slice ---
const bookSlice = createSlice({
  name: "books",
  initialState: {
    books: [],
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    resetBookSlice: (state) => {
      state.loading = false;
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAllBooks
      .addCase(fetchAllBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(fetchAllBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.books = action.payload;
      })
      .addCase(fetchAllBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // addBook
      .addCase(addBook.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(addBook.fulfilled, (state, action) => {
        state.loading = false;
        state.books.push(action.payload.book);
        state.message = action.payload.message;
      })
      .addCase(addBook.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // updateBook
      .addCase(updateBook.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(updateBook.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        const index = state.books.findIndex((b) => b._id === action.payload.book._id);
        if (index !== -1) state.books[index] = action.payload.book;
      })
      .addCase(updateBook.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // deleteBook
      .addCase(deleteBook.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(deleteBook.fulfilled, (state, action) => {
        state.loading = false;
        state.books = state.books.filter((b) => b._id !== action.payload.id);
        state.message = action.payload.message;
      })
      .addCase(deleteBook.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetBookSlice } = bookSlice.actions;
export default bookSlice.reducer;
