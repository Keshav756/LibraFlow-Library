import React, { useEffect, useState } from "react";
import logo from "../assets/black-logo.png";
import logo_with_title from "../assets/logo-with-title.png";
import { useDispatch, useSelector } from "react-redux";
import { login, resetAuthSlice } from "../store/slices/authSlice";
import { toast } from "react-toastify";
import { Link, Navigate, useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const { isLoading, error, message, isAuthenticated, user } = useSelector(
    (state) => state.auth
  );
  const navigateTo = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const data = {
      email,
      password,
    };
    dispatch(login(data));
  };

  useEffect(() => {
    if (message) {
      toast.success("✅ Login successful!");
      dispatch(resetAuthSlice());
      setTimeout(() => {
        navigateTo("/");
      }, 1500);
      dispatch(resetAuthSlice());
    }
    if (error) {
      toast.error(error);
      dispatch(resetAuthSlice());
    }
  }, [dispatch, message, error, navigateTo, isAuthenticated, user]);
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
            <p className="text-lg font-semibold">Logging you in...</p>
            <p className="text-sm text-gray-600 mt-2">
              Please wait while we check your credentials.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col justify-center md:flex-row h-screen">
        {/* Left Side */}
        <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-8 relative animate-slide-in-left">
          <div className="max-w-sm w-full ">
            <div className="flex justify-center mb-12 ">
              <div className="rounded-full flex items-center justify-center ">
                <img src={logo} alt="logo" className="h-24 w-full" />
              </div>
            </div>
            <h1 className="text-4xl font-medium text-center mb-12 overflow-hidden">
              Welcome Back !!
            </h1>
            <p className="text-gray-800 text-center mb-12 ">
              Please enter your credentials to login.
            </p>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  autoComplete="username"
                  className="w-full px-4 py-3 border border-black rounded-md focus:outline-none"
                />
              </div>
              <div className="mb-4 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 border border-black rounded-md focus:outline-none"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-gray-500"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <Link
                to={"/password/forgot"}
                className="font-semibold text-black mb-12"
              >
                Forgot Password
              </Link>
              <div className="block md:hidden font-semibold mt-5">
                <p>
                  New to our platform?{" "}
                  <Link
                    to={"/register"}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    Sign Up
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
                    <span>Loading...</span>
                  </>
                ) : (
                  "SIGN IN"
                )}
              </button>
            </form>
          </div>
        </div>
        {/* Right Side */}
        <div className="hidden w-full md:w-1/2 bg-black text-white md:flex flex-col items-center justify-center p-8  rounded-tl-[80px] rounded-bl-[80px] animate-slide-in-right">
          <div className="text-center h-[400px]">
            <div className="flex justify-center mb-12">
              <img
                src={logo_with_title}
                alt="logo"
                className="mb-12 h-44 w-auto"
              />
            </div>
            <p className="text-gray-300 mb-12">
              New to our platform? Sign up now.
            </p>
            <Link
              to={"/register"}
              className="border-2 mt-5 border-white px-8 w-full font-semibold bg-black text-white py-2 rounded-lg hover:bg-white hover:text-black transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              SIGN UP
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;