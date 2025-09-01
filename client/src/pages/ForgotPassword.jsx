import React, { useEffect, useState } from "react";
import logo from "../assets/black-logo.png";
import logo_with_title from "../assets/logo-with-title.png";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword, resetAuthSlice } from "../store/slices/authSlice";
import { toast } from "react-toastify";
import { Link, Navigate, useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();
  const { isLoading, isAuthenticated, message, user, error } = useSelector(
    (state) => state.auth
  );

  const navigateTo = useNavigate();

  const handleForgotPassword = (e) => {
    e.preventDefault();
    
    if (isSubmitting || isLoading) {
      return;
    }
    
    // Email validation
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    dispatch(forgotPassword(email.trim()));
  };

  useEffect(() => {
    if (message) {
      toast.success(`✅ Password reset link sent to your ${email}!`);
      setIsSubmitting(false);
      dispatch(resetAuthSlice());
      setTimeout(() => {
        navigateTo("/login");
      }, 2000);
    }
    if (error) {
      let errorMessage = error;
      
      // Handle specific error cases
      if (error.includes("Network Error") || error.includes("ERR_NETWORK")) {
        errorMessage = "Unable to connect to server. Please check your internet connection and try again.";
      } else if (error.includes("timeout")) {
        errorMessage = "Request timed out. Please try again.";
      } else if (error.includes("404") || error.includes("User not found")) {
        errorMessage = "User not found. Please check your email address.";
      } else if (error.includes("500")) {
        errorMessage = "Server error. Please try again later.";
      }
      
      toast.error(`❌ ${errorMessage}`);
      setIsSubmitting(false);
      dispatch(resetAuthSlice());
    }
  }, [dispatch, message, error, navigateTo]);

  // Reset submitting state when loading changes
  useEffect(() => {
    if (!isLoading) {
      setIsSubmitting(false);
    }
  }, [isLoading, isSubmitting]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      setIsSubmitting(false);
    };
  }, []);

  if (isAuthenticated) {
    return <Navigate to={"/"} />;
  }

  return (
    <>
      <div className="flex flex-col justify-center md:flex-row h-screen">
        {/* Left Section */}
        <div className="hidden w-full md:w-1/2 bg-black text-white md:flex flex-col items-center justify-center p-8 rounded-tr-[80px] rounded-br-[80px]">
          <div className="text-center h-[450px]">
            <div className="flex justify-center mb-12">
              <img
                src={logo_with_title}
                alt="Logo"
                className="mb-12 h-44 w-auto"
              />
            </div>
            <h3 className="text-gray-300 mv-12 max-w-[320px] mx-auto text-3xl font-medium leading-10">
              "Your premier digital library for borrowing and reading books"
            </h3>
          </div>
        </div>
        {/* Right Section */}
        <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-8 relative">
          <Link
            to={"/login"}
            className="border-2 border-black rounded-3xl font-bold w-52 py-2 px-4 fixed top-10 -left-28 hover:bg-black hover:text-white transition duration-300 text-end"
          >
            Back
          </Link>
          <div className="w-full max-w-sm ">
            <div className="flex justify-center mb-12">
              <div className="rounded-full flex items-center justify-center">
                <img src={logo} alt="logo" className="h-24 w-auto" />
              </div>
            </div>
            <h1 className="text-4xl font-medium text-center mb-5 overflow-hidden">
              Forgot Password
            </h1>
            <p className="text-gray-800 text-center mb-12">
              Enter your email address to reset your password.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="mb-4">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email"
                  disabled={isLoading || isSubmitting}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <button
                type="submit"
                className="border-2 mt-5 border-black w-full font-semibold bg-black text-white py-2 rounded-lg hover:bg-white hover:text-black transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || isSubmitting}
              >
                {isLoading || isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  "RESET PASSWORD"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;