import React, { useEffect, useState, useCallback } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import logo from "../assets/black-logo.png";
import logo_with_title from "../assets/logo-with-title.png";
import { useDispatch, useSelector } from "react-redux";
import { resetAuthSlice, resetPassword } from "../store/slices/authSlice";
import { toast } from "react-toastify";

const ResetPassword = () => {
  // State management
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Hooks
  const { token } = useParams();
  const dispatch = useDispatch();
  const navigateTo = useNavigate();
  const { isLoading, error, message, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  // Password strength checker
  const checkPasswordStrength = useCallback((password) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, []);

  // Handle password change
  const handlePasswordChange = useCallback((e) => {
    const newPassword = e.target.value;
    setFormData(prev => ({ ...prev, password: newPassword }));
    checkPasswordStrength(newPassword);
  }, [checkPasswordStrength]);

  // Handle confirm password change
  const handleConfirmPasswordChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
  }, []);

  // Check if password is valid
  const isPasswordValid = useCallback(() => {
    return Object.values(passwordStrength).every(Boolean);
  }, [passwordStrength]);

  // Check if passwords match
  const doPasswordsMatch = useCallback(() => {
    return formData.password === formData.confirmPassword;
  }, [formData.password, formData.confirmPassword]);

  // Check if form is valid
  const isFormValid = useCallback(() => {
    return formData.password && 
           formData.confirmPassword && 
           isPasswordValid() && 
           doPasswordsMatch();
  }, [formData.password, formData.confirmPassword, isPasswordValid, doPasswordsMatch]);

  // Handle form submission
  const handleResetPassword = useCallback((e) => {
    e.preventDefault();
    
    // Validation checks
    if (!formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields!");
      return;
    }

    if (!isPasswordValid()) {
      toast.error("Password does not meet security requirements!");
      return;
    }

    if (!doPasswordsMatch()) {
      toast.error("Passwords do not match!");
      return;
    }

    setIsSubmitting(true);
    const data = {
      password: formData.password,
      confirmPassword: formData.confirmPassword
    };
    
    dispatch(resetPassword(data, token));
  }, [formData, isPasswordValid, doPasswordsMatch, dispatch, token]);

  // Handle show/hide password
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  // Effect for handling auth state changes
  useEffect(() => {
    if (message && isAuthenticated) {
      toast.success("✅ Password reset successfully! You can now log in.");

    }
    
    if (error) {
      toast.error(error);
      dispatch(resetAuthSlice());
    }
    
    // Reset isSubmitting when request completes
    if (message || error) {
      setIsSubmitting(false);
    }
  }, [dispatch, message, error, isAuthenticated, navigateTo]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={"/"} replace />;
  }

  // Redirect if no token
  if (!token) {
    return <Navigate to={"/password/forgot"} replace />;
  }

  return (
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-sm mx-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-black">Resetting your password...</p>
            <p className="text-sm text-black mt-2">
              Please wait while we reset your password
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col justify-center md:flex-row h-screen">
        {/* Left Section - Branding */}
        <div className="w-full md:w-1/2 flex items-center justify-center bg-black text-white p-8 rounded-tr-[80px] rounded-br-[80px] relative">
          <div className="text-center h-[450px]">
            <div className="flex justify-center mb-12">
              <img
                src={logo_with_title}
                alt="Library Management System Logo"
                className="mb-12 h-44 w-auto"
              />
            </div>
            <h3 className="text-white mv-12 max-w-[320px] mx-auto text-3xl font-medium leading-10">
              "Your premier digital library for borrowing and reading books"
            </h3>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-8 relative">
          {/* Back Button */}
          <Link
            to={"/password/forgot"}
            className="border-2 border-black rounded-3xl font-bold w-52 py-2 px-4 fixed top-10 -left-28 hover:bg-black hover:text-white transition duration-300 text-end"
            aria-label="Go back to forgot password page"
          >
            Back
          </Link>

          <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="flex justify-center mb-12">
              <div className="rounded-full flex items-center justify-center">
                <img src={logo} alt="Library Logo" className="h-24 w-auto" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-medium text-center mb-5 overflow-hidden text-black">
              Reset Password
            </h1>
            <p className="text-black text-center mb-12">
              Please enter your new password
            </p>

            {/* Form */}
            <form onSubmit={handleResetPassword} className="space-y-6" noValidate>
              {/* Password Field */}
              <div className="mb-4">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Password"
                    disabled={isLoading || isSubmitting}
                    className="mt-1 block w-full px-3 py-2 pr-10 border border-black rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-describedby="password-strength"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={isLoading || isSubmitting}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="text-black text-sm">
                      {showPassword ? "Hide" : "Show"}
                    </span>
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div id="password-strength" className="mt-2 text-xs" role="status" aria-live="polite">
                    <div className="mb-2 text-black font-medium">Password strength:</div>
                    <div className="space-y-1">
                      <div className={`flex items-center ${passwordStrength.length ? 'text-black' : 'text-red-600'}`}>
                        <span className="mr-2" aria-hidden="true">{passwordStrength.length ? '✓' : '✗'}</span>
                        <span>At least 8 characters</span>
                      </div>
                      <div className={`flex items-center ${passwordStrength.uppercase ? 'text-black' : 'text-red-600'}`}>
                        <span className="mr-2" aria-hidden="true">{passwordStrength.uppercase ? '✓' : '✗'}</span>
                        <span>One uppercase letter</span>
                      </div>
                      <div className={`flex items-center ${passwordStrength.lowercase ? 'text-black' : 'text-red-600'}`}>
                        <span className="mr-2" aria-hidden="true">{passwordStrength.lowercase ? '✓' : '✗'}</span>
                        <span>One lowercase letter</span>
                      </div>
                      <div className={`flex items-center ${passwordStrength.number ? 'text-black' : 'text-red-600'}`}>
                        <span className="mr-2" aria-hidden="true">{passwordStrength.number ? '✓' : '✗'}</span>
                        <span>One number</span>
                      </div>
                      <div className={`flex items-center ${passwordStrength.special ? 'text-black' : 'text-red-600'}`}>
                        <span className="mr-2" aria-hidden="true">{passwordStrength.special ? '✓' : '✗'}</span>
                        <span>One special character</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    required
                    placeholder="Confirm Password"
                    disabled={isLoading || isSubmitting}
                    className="mt-1 block w-full px-3 py-2 pr-10 border border-black rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-describedby="password-match"
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={isLoading || isSubmitting}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    <span className="text-black text-sm">
                      {showConfirmPassword ? "Hide" : "Show"}
                    </span>
                  </button>
                </div>

                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <div id="password-match" className="mt-1 text-xs" role="status" aria-live="polite">
                    {!doPasswordsMatch() ? (
                      <p className="text-red-600">Passwords do not match</p>
                    ) : (
                      <p className="text-black">Passwords match</p>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="border-2 mt-5 border-black w-full font-semibold bg-black text-white py-2 rounded-lg hover:bg-white hover:text-black transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-black disabled:text-white"
                disabled={isLoading || isSubmitting || !isFormValid()}
                aria-describedby={!isFormValid() ? "form-validation" : undefined}
              >
                {isLoading || isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  "RESET PASSWORD"
                )}
              </button>

              {/* Form Validation Message */}
              {!isFormValid() && formData.password && (
                <div id="form-validation" className="text-xs text-red-600 text-center" role="alert">
                  Please ensure all requirements are met before submitting
                </div>
              )}
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-black">
                Remember your password?{" "}
                <Link 
                  to="/login" 
                  className="text-black hover:text-black font-medium transition duration-200"
                  aria-label="Go to login page"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
