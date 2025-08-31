// client/src/store/slices/popupSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  addBookPopup: false,
  editBookPopup: false,
  readBookPopup: false,
  recordBookPopup: false,
  settingPopup: false,
  addNewAdminPopup: false,
  returnBookPopup: false,
  selectedBook: null, // Store the full book object for editing/recording/returning
};

const popupSlice = createSlice({
  name: "popup",
  initialState,
  reducers: {
    // Toggle popups
    toggleAddBookPopup: (state, action = {}) => {
      state.addBookPopup = action.payload?.open ?? !state.addBookPopup;
    },
    toggleEditBookPopup: (state, action = {}) => {
      state.editBookPopup = action.payload?.open ?? !state.editBookPopup;
      state.selectedBook = action.payload?.book ?? null;
    },
    toggleReadBookPopup: (state, action = {}) => {
      state.readBookPopup = action.payload?.open ?? !state.readBookPopup;
      state.selectedBook = action.payload?.book ?? null;
    },
    toggleRecordBookPopup: (state, action = {}) => {
      state.recordBookPopup = action.payload?.open ?? !state.recordBookPopup;
      state.selectedBook = action.payload?.book ?? null;
    },
    toggleSettingPopup: (state, action = {}) => {
      state.settingPopup = action.payload?.open ?? !state.settingPopup;
    },
    toggleAddNewAdminPopup: (state, action = {}) => {
      state.addNewAdminPopup = action.payload?.open ?? !state.addNewAdminPopup;
    },
    toggleReturnBookPopup: (state, action = {}) => {
      state.returnBookPopup = action.payload?.open ?? !state.returnBookPopup;
      state.selectedBook = action.payload?.book ?? null;
    },

    // Close popups individually
    closeAllPopups: (state) => {
      state.addBookPopup = false;
      state.editBookPopup = false;
      state.readBookPopup = false;
      state.recordBookPopup = false;
      state.settingPopup = false;
      state.addNewAdminPopup = false;
      state.returnBookPopup = false;
      state.selectedBook = null;
    },
    closeEditBookPopup: (state) => {
      state.editBookPopup = false;
      state.selectedBook = null;
    },
    closeRecordBookPopup: (state) => {
      state.recordBookPopup = false;
      state.selectedBook = null;
    },
    closeReturnBookPopup: (state) => {
      state.returnBookPopup = false;
      state.selectedBook = null;
    },
  },
});

export const {
  toggleAddBookPopup,
  toggleEditBookPopup,
  toggleReadBookPopup,
  toggleRecordBookPopup,
  toggleSettingPopup,
  toggleAddNewAdminPopup,
  toggleReturnBookPopup,
  closeAllPopups,
  closeEditBookPopup,
  closeRecordBookPopup,
  closeReturnBookPopup,
} = popupSlice.actions;

export default popupSlice.reducer;
