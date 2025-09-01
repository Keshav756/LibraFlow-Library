import React, { useEffect } from "react";
import logo from "../assets/black-logo.png";
import logo_with_title from "../assets/logo-with-title.png";
import { Navigate, useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { otpVerification, resetAuthSlice } from "../store/slices/authSlice";
import { toast } from "react-toastify";

const OTP = () => {
  const { email } = useParams();
  const [otp, setOtp] = React.useState("");
  const dispatch = useDispatch();
  const navigateTo = useNavigate();

  const { isLoading, error, message, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const handleOtpVerification = (e) => {
    e.preventDefault();
    dispatch(otpVerification(email, otp));
  };

  useEffect(() => {
    if (message && isAuthenticated) {
      toast.success("✅ Account verified successfully! Welcome to LibraFlow!");
      setTimeout(() => {
        navigateTo("/");
      }, 2000);
    }
    if (error) {
      toast.error(error);
      dispatch(resetAuthSlice());
    }
  }, [dispatch, message, error, isAuthenticated, navigateTo]);

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
            <p className="text-lg font-semibold">Verifying your account...</p>
            <p className="text-sm text-gray-600 mt-2">Please wait while we verify your OTP</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col justify-center md:flex-row h-screen">
        {/* Left Side */}
        <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-8 relative">
          <Link
            to={"/register"}
            className="border-2 border-black rounded-3xl font-bold w-52 py-2 px-4 fixed top-10 -left-28 hover:bg-black hover:text-white transition duration-300 text-end"
          >
            Back
          </Link>
          <div className="max-w-sm w-full ">
            <div className="flex justify-center mb-12 ">
              <div className="rounded-full flex items-center justify-center ">
                <img src={logo} alt="logo" className="h-24 w-full" />
              </div>
            </div>
            <h1 className="text-4xl font-medium text-center mb-12 overflow-hidden">
              Check your Mailbox{" "}
            </h1>
            <p className="text-gray-800 text-center mb-12 ">
              Please enter the otp to proceed
            </p>
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-green-600">✅</span>
                <span className="text-green-800 text-sm font-medium">
                  Verification code sent to {email}
                </span>
              </div>
            </div>
            <form onSubmit={handleOtpVerification}>
              <div className="mb-4">
                <input
                  type="number"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="OTP"
                  className="w-full px-4 py-3 border border-black rounded-md focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="border-2 mt-5 border-black w-full font-semibold bg-black text-white py-2 rounded-lg hover:bg-white hover:text-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  "VERIFY"
                )}
              </button>
            </form>
          </div>
        </div>
        {/* Right Side */}
        <div className="hidden w-full md:w-1/2 bg-black text-white md:flex flex-col items-center justify-center p-8  rounded-tl-[80px] rounded-bl-[80px]">
          <div className="text-center h-[400px]">
            <div className="flex justify-center mb-12">
              <img src={logo_with_title} alt="logo" className="mb-12 h-44 w-auto"/>
            </div>
            <p className="text-gray-300 mb-12">New to our platform? Sign up now.</p>
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

export default OTP;