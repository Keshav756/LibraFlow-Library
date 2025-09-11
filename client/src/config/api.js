// src/config/api.js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://libraflow-library-management-system.onrender.com/api/v1";

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: () => `${API_BASE_URL}/auth/register`,
    LOGIN: () => `${API_BASE_URL}/auth/login`,
    LOGOUT: () => `${API_BASE_URL}/auth/logout`,
    ME: () => `${API_BASE_URL}/auth/me`,
    VERIFY_OTP: () => `${API_BASE_URL}/auth/verify-otp`,
    FORGOT_PASSWORD: () => `${API_BASE_URL}/auth/password/forgot`,
    RESET_PASSWORD: (token) => `${API_BASE_URL}/auth/password/reset/${token}`,
    UPDATE_PASSWORD: () => `${API_BASE_URL}/auth/password/update`,
  },

  USER: {
    ALL: () => `${API_BASE_URL}/user/all`,
    ADD_ADMIN: () => `${API_BASE_URL}/user/add/new-admin`,
  },

  BOOK: {
    ALL: () => `${API_BASE_URL}/book/all`,
    ADD: () => `${API_BASE_URL}/book/admin/add`,
    UPDATE: (id) => `${API_BASE_URL}/book/admin/update/${id}`,
    DELETE: (id) => `${API_BASE_URL}/book/admin/delete/${id}`,
  },

  BORROW: {
    MY_BORROWED_BOOKS: (email) =>
      `${API_BASE_URL}/borrow/my-borrowed-books?email=${email}`,
    ALL_BORROWED_BOOKS: () => `${API_BASE_URL}/borrow/admin/borrowed-books`,
    RECORD_BORROW: (bookId) =>
      `${API_BASE_URL}/borrow/record-borrow-book/${bookId}`,
    RETURN_BORROW: (bookId) =>
      `${API_BASE_URL}/borrow/return-borrow-book/${bookId}`,
  },

  FINE: {
    CALCULATE: (borrowId) => `${API_BASE_URL}/fines/calculate/${borrowId}`,
    SUMMARY: (userId) => `${API_BASE_URL}/fines/summary/${userId}`,
    PAY: (borrowId) => `${API_BASE_URL}/fines/pay/${borrowId}`,
    CREATE_ORDER: () => `${API_BASE_URL}/fines/create-order`,
    PREVIEW: () => `${API_BASE_URL}/fines/preview`,
    ANALYTICS: () => `${API_BASE_URL}/fines/analytics`,
    DOCS: () => `${API_BASE_URL}/fines/docs`,
    ADMIN: {
      BULK_CALCULATE: () => `${API_BASE_URL}/fines/admin/bulk-calculate`,
      ANALYTICS: () => `${API_BASE_URL}/fines/admin/analytics`,
      AMNESTY: (userId) => `${API_BASE_URL}/fines/admin/amnesty/${userId}`,
      UPDATE_ALL: () => `${API_BASE_URL}/fines/admin/update-all`,
    },
  },
};

export { API_BASE_URL };