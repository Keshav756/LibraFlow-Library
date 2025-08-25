import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

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

export const fetchUserBorrowedBooks = () => async (dispatch, getState) => {
  dispatch(borrowSlice.actions.fetchUserBorrowedBooksRequest());

  // Get email from Redux auth slice
  const email = getState().auth?.user?.email;
  if (!email) {
    dispatch(borrowSlice.actions.fetchUserBorrowedBooksFailed("User email not found in state"));
    return;
  }

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
};

export default borrowSlice.reducer;
