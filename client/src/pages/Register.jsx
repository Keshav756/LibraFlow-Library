import React, { useEffect, useState } from "react";
import logo from "../assets/black-logo.png";
import logo_with_title from "../assets/logo-with-title.png";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { register, resetAuthSlice } from "../store/slices/authSlice";
import { toast } from "react-toastify";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();

  // Use correct property names from Redux state
  const { isLoading, error, message, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const navigateTo = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    // Use plain object, not FormData, for JSON API
    const data = { name, email, password };
    dispatch(register(data));
  };

  useEffect(() => {
    if (message) {
      toast.success("✅ Registration successful! Verification code sent to your email.");
      dispatch(resetAuthSlice());
      // Redirect to OTP verification page after a short delay`q
      setTimeout(() => {
        navigateTo(`/otp-verification/${email}`);
      }, 1500);
    }
    if (error) {
      toast.error(error);
      dispatch(resetAuthSlice());
    }
  }, [dispatch, message, error, email, navigateTo]);

  if (isAuthenticated) {
    return <Navigate to={"/"} />;
  }

  return (
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-lg font-semibold">Creating your account...</p>
            <p className="text-sm text-gray-600 mt-2">Please wait while we set up your account</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col justify-center md:flex-row h-screen">
        {/* Left Side */}
        <div className="hidden w-full md:w-1/2 bg-black text-white md:flex flex-col items-center justify-center p-8 rounded-tr-[80px] rounded-br-[80px] animate-slide-in-left">
          <div className="text-center h-[376px]">
            <div className="flex justify-center mb-12">
              <img
                src={logo_with_title}
                alt="Logo"
                className="mb-12 h-44 w-auto"
              />
            </div>
            <p className="text-gray-300 mb-12">
              Already have Account? Sign in now.
            </p>
            <Link
              to="/login"
              className="border-2 rounded-lg font-semibold border-white py-2 px-8 hover:bg-white hover:text-black transition"
            >
              SIGN IN
            </Link>
          </div>
        </div>
        {/* Right Side */}
        <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8 animate-slide-in-right">
          <div className="w-full max-w-sm">
            <div className="flex justify-center mb-12">
              <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-5">
                <h3 className="font-medium text-4xl overflow-hidden">
                  Sign Up
                </h3>
                <img
                  src={logo}
                  alt="Logo"
                  className="h-auto w-24 object-cover"
                />
              </div>
            </div>

            <p className="text-gray-800 text-center mb-12">
              Please provide your information to sign up.
            </p>
            {isLoading && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-blue-800 text-sm font-medium">
                    Creating your account and sending verification email...
                  </span>
                </div>
              </div>
            )}
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="mb-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-4 py-2 border border-black rounded-md focus:outline-none "
                  required
                />
              </div>
              <div className="mb-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-2 border border-black rounded-md focus:outline-none "
                  required
                />
              </div>
              <div className="mb-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-2 border border-black rounded-md focus:outline-none "
                  required
                />
              </div>
              <div className="block md:hidden font-semibold mt-5">
                <p>
                  Already have account?
                  <Link to="/login" className="text-gray-500 hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="border-2 mt-5 border-black w-full font-semibold bg-black text-white py-2 rounded-lg hover:bg-white hover:text-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
