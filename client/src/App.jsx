import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import "react-toastify/dist/ReactToastify.css";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OTP from "./pages/OTP";

import { getUser } from "./store/slices/authSlice";
import { fetchAllUsers } from "./store/slices/userSlice";
import { fetchAllBooks } from "./store/slices/bookSlice";
import { fetchUserBorrowedBooks, fetchAllBorrowedBooks } from "./store/slices/borrowSlice";

const App = () => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // ✅ Load user on app start
  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);

  // ✅ Fetch role-specific data when logged in
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    dispatch(fetchAllBooks());

    if (user.role === "User" && user.email) {
      dispatch(fetchUserBorrowedBooks(user.email));
    }

    if (user.role === "Admin") {
      dispatch(fetchAllUsers());
      dispatch(fetchAllBorrowedBooks());
    }
  }, [isAuthenticated, user, dispatch]);

  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />}
        />
        <Route
          path="/register"
          element={!isAuthenticated ? <Register /> : <Navigate to="/" replace />}
        />
        <Route path="/password/forgot" element={<ForgotPassword />} />
        <Route path="/password/reset/:token" element={<ResetPassword />} />
        <Route path="/otp-verification/:email" element={<OTP />} />

        {/* Protected route */}
        <Route
          path="/"
          element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />}
        />

        {/* ✅ Optional: fallback for unknown routes */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
      </Routes>

      {/* Toasts */}
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />
    </Router>
  );
};

export default App;
