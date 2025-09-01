// client/src/pages/OTP.jsx
import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { verifyOtp, resetAuthState, resendOtp } from "../store/slices/authSlice";

const OTP = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading } = useSelector((state) => state.auth);

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);
  const [resendCooldown, setResendCooldown] = useState(30);

  // Auto-focus first box
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, ""); // only digits
    if (!value) return;

    // Handle paste of multiple digits
    if (value.length > 1) {
      const digits = value.split("").slice(0, 6);
      const updatedOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          updatedOtp[index + i] = digit;
        }
      });
      setOtp(updatedOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Single digit entry
      const updatedOtp = [...otp];
      updatedOtp[index] = value.charAt(0);
      setOtp(updatedOtp);
      if (index < 5) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    try {
      const result = await dispatch(verifyOtp({ otp: enteredOtp })).unwrap();
      toast.success(result?.message || "OTP verified successfully!");
      dispatch(resetAuthState());
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.message || "Invalid OTP, please try again");
    }
  };

  const handleResend = async () => {
    try {
      const result = await dispatch(resendOtp()).unwrap();
      toast.success(result?.message || "OTP resent to your email/phone!");
      setOtp(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
      setResendCooldown(30); // reset cooldown
    } catch (err) {
      toast.error(err?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-center mb-2">Verify OTP</h2>
        <p className="text-gray-600 text-center mb-6">
          Enter the 6-digit code sent to your email/phone
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          {/* OTP Inputs */}
          <div className="flex justify-center gap-3 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                aria-label={`Digit ${index + 1}`}
                className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="border-2 border-black w-full font-semibold bg-black text-white py-2 rounded-lg hover:bg-white hover:text-black transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-black disabled:text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div
                  className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                  aria-hidden="true"
                ></div>
                <span>Verifying...</span>
              </div>
            ) : (
              "Verify OTP"
            )}
          </button>

          {/* Resend OTP */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-sm font-medium text-blue-600 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `Resend OTP in ${resendCooldown}s`
                : "Resend OTP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OTP;
