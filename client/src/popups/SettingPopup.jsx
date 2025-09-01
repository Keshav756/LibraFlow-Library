import React, { useState } from 'react'
import closeIcon from "../assets/close-square.png";
import { useDispatch, useSelector } from 'react-redux';
import { updatePassword } from '../store/slices/authSlice';
import settingIcon from "../assets/setting.png";
import { toggleSettingPopup } from '../store/slices/popupSlice';
import { toast } from "react-toastify";

const SettingPopup = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  // Clear form function
  const clearForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setIsSuccess(false);
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (newPassword !== confirmNewPassword) {
      toast.error("New password and confirm password do not match!");
      return;
    }

    const data = new FormData();
    data.append("currentPassword", currentPassword);
    data.append("newPassword", newPassword);
    data.append("confirmNewPassword", confirmNewPassword);
    
    dispatch(updatePassword(data)).then((result) => {
      if (!result.error) {
        setIsSuccess(true);
        clearForm();
        toast.success("Password updated successfully!");
        // Close popup after 2 seconds to show success message
        setTimeout(() => {
          dispatch(toggleSettingPopup());
        }, 2000);
      } else {
        toast.error(result.message || "Failed to update password.");
      }
    });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 p-4 flex items-center justify-center z-50">
    <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-white rounded-lg shadow-lg mx-4">
      <div className="p-6">
        <header className="flex items-center justify-between mb-7 pb-5 border-b-[1px] border-black">
          <div className="flex items-center gap-3">
            <img
              src={settingIcon}
              alt="setting-icon"
              className="bg-gray-300 p-5 rounded-lg"
            />
            <h3 className="text-xl font-bold">Change Credentials</h3>
          </div>
          <img
            src={closeIcon}
            alt="close-icon"
            onClick={() => {
              clearForm();
              dispatch(toggleSettingPopup());
            }}
            className="cursor-pointer hover:opacity-70 transition-opacity"
          />
        </header>
        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Password Changed Successfully!
            </h3>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  clearForm();
                  dispatch(toggleSettingPopup());
                }}
                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {/* Current Password Input */}
            <div className="mb-4">
              <label className="block text-gray-900 font-medium mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                placeholder="Enter your current password"
                required
              />
            </div>
            {/* New Password Input */}
            <div className="mb-4">
              <label className="block text-gray-900 font-medium mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                placeholder="Enter your new password"
                required
              />
            </div>
            {/* Confirm Password Input */}
            <div className="mb-4">
              <label className="block text-gray-900 font-medium mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                placeholder="Confirm your new password"
                required
              />
            </div>
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  clearForm();
                  dispatch(toggleSettingPopup());
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  </div>
  )
}

export default SettingPopup;