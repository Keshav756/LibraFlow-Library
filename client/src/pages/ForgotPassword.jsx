import React, { useEffect, useState } from "react";
import logo from "../assets/black-logo.png";
import logo_with_title from "../assets/logo-with-title.png";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword, resetAuthState } from "../store/slices/authSlice";
import { Link, Navigate } from "react-router-dom";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();
  const { loading, error, message, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleForgotPassword = (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) return toast.error("Please enter your email address");
    if (!emailRegex.test(trimmedEmail))
      return toast.error("Please enter a valid email address");

    setIsSubmitting(true);
    dispatch(forgotPassword({ email: trimmedEmail }));
  };

  // Debounced email validation
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedEmail = email.trim();
      if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
        setEmailError("⚠️ Invalid email format");
      } else {
        setEmailError("");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  // Reset submitting state & handle success/error
  useEffect(() => {
    if (message) {
      toast.success(message.message || "Password reset email sent!");
      setEmail(""); // clear email input after success
      setIsSubmitting(false);
      dispatch(resetAuthState());
    }

    if (error) {
      toast.error(error);
      setIsSubmitting(false);
      dispatch(resetAuthState());
    }
  }, [message, error, dispatch]);

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="flex flex-col justify-center md:flex-row h-screen">
      {/* Left Section */}
      <div className="hidden md:flex w-full md:w-1/2 bg-black text-white flex-col items-center justify-center p-8 rounded-tr-[80px] rounded-br-[80px]">
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
          to="/login"
          className="border-2 border-black rounded-3xl font-bold w-52 py-2 px-4 fixed top-10 -left-28 hover:bg-black hover:text-white transition duration-300 text-end"
        >
          Back
        </Link>

        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-12">
            <img src={logo} alt="logo" className="h-24 w-auto" />
          </div>
          <h1 className="text-4xl font-medium text-center mb-5">
            Forgot Password
          </h1>
          <p className="text-gray-800 text-center mb-12">
            Enter your email address to reset your password.
          </p>

          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                disabled={loading || isSubmitting}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="border-2 mt-5 border-black w-full font-semibold bg-black text-white py-2 rounded-lg hover:bg-white hover:text-black transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                "SEND RESET LINK"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
