import React, { useState } from "react";
import placeHolder from "../assets/placeholder.jpg";
import closeIcon from "../assets/close-square.png";
import keyIcon from "../assets/key.png";
import { useDispatch, useSelector } from "react-redux";
import { addNewAdmin, resetUserSlice } from "../store/slices/userSlice";
import { toggleAddNewAdminPopup } from "../store/slices/popupSlice"; // ✅ Import toggle action
import { toast } from "react-toastify";

const AddNewAdmin = ({ onClose }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.user);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const clearForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setAvatar(null);
    setAvatarPreview(null);
    setIsSuccess(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setAvatar(file);

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) {
        setAvatarPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNewAdmin = (e) => {
    e.preventDefault();

    // ===== Frontend Validations =====
    if (!avatar) {
      toast.error("Please select an avatar image");
      return;
    }
    if (password.length < 8 || password.length > 16) {
      toast.error("Password must be between 8 and 16 characters");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("email", email.trim());
    formData.append("password", password);
    formData.append("avatar", avatar);

    dispatch(addNewAdmin(formData)).then((result) => {
      if (!result.error) {
        setIsSuccess(true);
        clearForm();
        setTimeout(() => {
          if (onClose) onClose();
          else dispatch(toggleAddNewAdminPopup()); // ✅ Close even if no prop
          dispatch(resetUserSlice());
        }, 2000);
      }
    });
  };

  const handleClose = () => {
    clearForm();
    if (onClose) onClose();
    else dispatch(toggleAddNewAdminPopup()); // ✅ Redux fallback
    dispatch(resetUserSlice());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 p-4 flex items-center justify-center z-50">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-white rounded-lg shadow-lg mx-4">
        <div className="p-6">
          <header className="flex items-center justify-between mb-7 pb-5 border-b-[1px] border-black">
            <div className="flex items-center gap-3">
              <img
                src={keyIcon}
                alt="key-icon"
                className="bg-gray-300 p-5 rounded-lg"
              />
              <h3 className="text-xl font-bold">Add New Admin</h3>
            </div>
            <img
              src={closeIcon}
              alt="close-icon"
              onClick={handleClose}
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
                Admin Added Successfully!
              </h3>
              <p className="text-gray-600">
                The new admin has been created and will appear in the users list.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleNewAdmin} className="space-y-4">
              <div className="flex flex-col items-center mb-6">
                <label htmlFor="avatarInput" className="cursor-pointer">
                  <img
                    src={avatarPreview ? avatarPreview : placeHolder}
                    alt="avatar"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
                  />
                  <input
                    type="file"
                    id="avatarInput"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="mb-4">
                <label className="block text-gray-900 font-medium mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="Admin's Name"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-900 font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="Admin's Email"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-900 font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="Admin's Password"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
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
                  {loading ? "Adding..." : "Add Admin"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddNewAdmin;
