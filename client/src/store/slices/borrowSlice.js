import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = "https://libraflow-library-management-system.onrender.com/api/v1/borrow";

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
    const res = await axios.get(`${API_BASE}/my-borrowed-books`, { withCredentials: true });
    dispatch(fetchUserBorrowedBooksSuccess(res.data.borrowedBooks));
  } catch (error) {
    dispatch(fetchUserBorrowedBooksFailed(error.response?.data?.message || error.message));
  }
<<<<<<< HEAD

  await axios
    .get(`https://libraflow-libraray-management-system.onrender.com/api/v1/borrow/my-borrowed-books?email=${email}`, {
      withCredentials: true,
    })
    .then((res) => {
      dispatch(borrowSlice.actions.fetchUserBorrowedBooksSuccess(res.data.borrowedBooks));
    })
    .catch((error) => {
      dispatch(
        borrowSlice.actions.fetchUserBorrowedBooksFailed(
          error.response?.data?.message || error.message
        )
      );
    });
};

export const fetchAllBorrowedBooks = () => async (dispatch) => {
  dispatch(borrowSlice.actions.fetchAllBorrowedBooksRequest());
  await axios
    .get("https://libraflow-libraray-management-system.onrender.com/api/v1/borrow/admin/borrowed-books", {
      withCredentials: true,
    })
    .then((res) => {
      dispatch(borrowSlice.actions.fetchAllBorrowedBooksSuccess(res.data.borrowedBooks));
    })
    .catch((error) => {
      dispatch(
        borrowSlice.actions.fetchAllBorrowedBooksFailed(
          error.response?.data?.message || error.message
        )
      );
    });
};

export const recordBorrowBook = (email, id) => async (dispatch) => {
  dispatch(borrowSlice.actions.recordBookRequest());
  await axios
    .post(
      `https://libraflow-libraray-management-system.onrender.com/api/v1/borrow/record-borrow-book/${id}`,
      { email },
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    )
    .then((res) => {
      dispatch(borrowSlice.actions.recordBookSuccess(res.data.message));
      dispatch(recordBorrowBook());
    })
    .catch((error) => {
      dispatch(
        borrowSlice.actions.recordBookFailed(
          error.response?.data?.message || error.message
        )
      );
    });
};

export const returnBorrowBook = (email, id) => async (dispatch) => {
  dispatch(borrowSlice.actions.returnBookRequest());
  await axios
    .put(
      `https://libraflow-libraray-management-system.onrender.com/api/v1/borrow/return-borrow-book/${id}`,
      { email },
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    )
    .then((res) => {
      dispatch(borrowSlice.actions.returnBookSuccess(res.data.message));
    })
    .catch((error) => {
      dispatch(
        borrowSlice.actions.returnBookFailed(
          error.response?.data?.message || error.message
        )
      );
    });
};

export const resetBorrowSlice = () => (dispatch) => {
  dispatch(borrowSlice.actions.resetBorrowSlice());
=======
};

export const fetchAllBorrowedBooks = () => async (dispatch) => {
  dispatch(fetchAllBorrowedBooksRequest());
  try {
    const res = await axios.get(`${API_BASE}/admin/borrowed-books`, { withCredentials: true });
    dispatch(fetchAllBorrowedBooksSuccess(res.data.borrowedBooks));
  } catch (error) {
    dispatch(fetchAllBorrowedBooksFailed(error.response?.data?.message || error.message));
  }
};

export const recordBorrowBook = (email, bookId) => async (dispatch) => {
  dispatch(recordBookRequest());
  try {
    const res = await axios.post(`${API_BASE}/record-borrow-book/${bookId}`, { email }, { withCredentials: true });
    dispatch(recordBookSuccess(res.data.message));
    dispatch(fetchUserBorrowedBooks());
  } catch (error) {
    dispatch(recordBookFailed(error.response?.data?.message || error.message));
  }
};

export const returnBorrowBook = (email, bookId) => async (dispatch) => {
  dispatch(returnBookRequest());
  try {
    const res = await axios.put(`${API_BASE}/return-borrow-book/${bookId}`, { email }, { withCredentials: true });
    dispatch(returnBookSuccess(res.data.message));
    dispatch(fetchUserBorrowedBooks());
  } catch (error) {
    dispatch(returnBookFailed(error.response?.data?.message || error.message));
  }
>>>>>>> 1730d72 (final commit)
};

export default borrowSlice.reducer;
