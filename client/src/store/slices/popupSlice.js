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
  selectedBook: null,
};

const popupSlice = createSlice({
  name: "popup",
  initialState,
  reducers: {
    toggleAddBookPopup: (state, action) => {
      state.addBookPopup = action.payload ?? !state.addBookPopup;
    },
    toggleEditBookPopup: (state, action) => {
      state.editBookPopup = action.payload?.open ?? !state.editBookPopup;
      state.selectedBook = action.payload?.book ?? state.selectedBook;
    },
    toggleReadBookPopup: (state, action) => {
      state.readBookPopup = action.payload ?? !state.readBookPopup;
    },
    toggleRecordBookPopup: (state, action) => {
      state.recordBookPopup = action.payload ?? !state.recordBookPopup;
    },
    toggleSettingPopup: (state, action) => {
      state.settingPopup = action.payload ?? !state.settingPopup;
    },
    toggleAddNewAdminPopup: (state, action) => {
      state.addNewAdminPopup = action.payload ?? !state.addNewAdminPopup;
    },
    toggleReturnBookPopup: (state, action) => {
      state.returnBookPopup = action.payload ?? !state.returnBookPopup;
    },
    closeAllPopups: (state) => {
      state.addBookPopup = false;
      state.editBookPopup = false;
      state.readBookPopup = false;
      state.recordBookPopup = false;
      state.settingPopup = false;
      state.addNewAdminPopup = false;
      state.returnBookPopup = false;
    },
    // ✅ Close only EditBookPopup
    closeEditBookPopup: (state) => {
      state.editBookPopup = false;
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
  closeEditBookPopup, // ✅ export new action
} = popupSlice.actions;

export default popupSlice.reducer;
