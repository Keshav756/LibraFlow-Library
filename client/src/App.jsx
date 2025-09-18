import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OTP from "./pages/OTP";
import { ToastContainer } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { getUser } from "./store/slices/authSlice";
import { fetchAllUsers } from "./store/slices/userSlice";
import { fetchAllBooks } from "./store/slices/bookSlice";
import { fetchUserBorrowedBooks, fetchAllBorrowedBooks } from "./store/slices/borrowSlice";

const App = () => {
  const { user, isAuthenticated } = useSelector((state)=> state.auth);
  const dispatch = useDispatch();
  useEffect(() => {
    // Only try to get user if there's a token in localStorage
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(getUser());
    }
    
    // Always fetch books (now public)
    dispatch(fetchAllBooks());
  }, [dispatch]);

  useEffect(() => {
    // Only fetch user-specific data when authenticated and user data is loaded
    if (isAuthenticated && user) {
      if (user.role === "User" && user.email) {
        dispatch(fetchUserBorrowedBooks(user.email));
      }
      if (user.role === "Admin") {
        dispatch(fetchAllUsers());
        dispatch(fetchAllBorrowedBooks());
      }
    }
  }, [isAuthenticated, user, dispatch]);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/password/forgot" element={<ForgotPassword />} />
        <Route path="/password/reset/:token" element={<ResetPassword />} />
        <Route path="/otp-verification/:email" element={<OTP />} />
      </Routes>
      <ToastContainer theme="dark" />
    </Router>
  );
};

export default App;