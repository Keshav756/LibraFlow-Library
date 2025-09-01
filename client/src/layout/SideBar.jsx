import React, { useEffect } from "react";
import logo_with_title from "../assets/logo-with-title.png";
import logoutIcon from "../assets/logout.png";
import closeIcon from "../assets/white-close-icon.png";
import dashboardIcon from "../assets/element.png";
import bookIcon from "../assets/book.png";
import catalogIcon from "../assets/catalog.png";
import settingIcon from "../assets/setting-white.png";
import usersIcon from "../assets/people.png";
import { RiAdminFill } from "react-icons/ri";

import { useDispatch, useSelector } from "react-redux";
import { logout, resetAuthState } from "../store/slices/authSlice";
import { toast } from "react-toastify";
import {
  toggleAddNewAdminPopup,
  toggleSettingPopup,
} from "../store/slices/popupSlice";
import AddNewAdmin from "../popups/AddNewAdmin";
import SettingPopup from "../popups/SettingPopup";

const SideBar = ({ isSideBarOpen, setIsSideBarOpen, setSelectedComponent }) => {
  const dispatch = useDispatch();

  const { addNewAdminPopup, settingPopup } = useSelector(
    (state) => state.popup
  );
  const { loading, error, message, isAuthenticated, user } = useSelector(
    (state) => state.auth
  );

  const handleComponentSelect = (componentName) => {
    setSelectedComponent(componentName);
    // Auto-close on mobile
    if (window.innerWidth < 768) {
      setIsSideBarOpen(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success("✅ Logged out successfully!");
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(resetAuthState());
    }
    if (message) {
      toast.success(message);
      dispatch(resetAuthState());
    }
  }, [dispatch, error, message]);

  return (
    <>
      <aside
        className={`${
          isSideBarOpen ? "left-0" : "-left-full"
        } z-10 transition-all duration-700 md:relative md:left-0 flex w-64 bg-black text-white flex-col h-full`}
        style={{ position: "fixed" }}
      >
        {/* Logo */}
        <div className="px-6 py-4 my-8">
          <img src={logo_with_title} alt="logo" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 space-y-2">
          <button
            onClick={() => handleComponentSelect("Dashboard")}
            className="w-full py-2 font-medium rounded-md flex items-center space-x-2 hover:translate-x-1 transition-transform duration-300"
          >
            <img src={dashboardIcon} alt="dashboard" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleComponentSelect("Books")}
            className="w-full py-2 font-medium rounded-md flex items-center space-x-2 hover:translate-x-1 transition-transform duration-300"
          >
            <img src={bookIcon} alt="books" />
            <span>Books</span>
          </button>

          {isAuthenticated && user?.role === "Admin" && (
            <>
              <button
                onClick={() => handleComponentSelect("Catalog")}
                className="w-full py-2 font-medium rounded-md flex items-center space-x-2 hover:translate-x-1 transition-transform duration-300"
              >
                <img src={catalogIcon} alt="catalog" />
                <span>Catalog</span>
              </button>

              <button
                onClick={() => handleComponentSelect("Users")}
                className="w-full py-2 font-medium rounded-md flex items-center space-x-2 hover:translate-x-1 transition-transform duration-300"
              >
                <img src={usersIcon} alt="users" />
                <span>Users</span>
              </button>

              <button
                onClick={() => {
                  dispatch(toggleAddNewAdminPopup());
                  if (window.innerWidth < 768) setIsSideBarOpen(false);
                }}
                className="w-full py-2 font-medium rounded-md flex items-center space-x-2 hover:translate-x-1 transition-transform duration-300"
              >
                <RiAdminFill className="w-6 h-6" />
                <span>Add New Admin</span>
              </button>
            </>
          )}

          {isAuthenticated && user?.role === "User" && (
            <button
              onClick={() => handleComponentSelect("My Borrowed Books")}
              className="w-full py-2 font-medium rounded-md flex items-center space-x-2 hover:translate-x-1 transition-transform duration-300"
            >
              <img src={catalogIcon} alt="my-borrowed-books" />
              <span>My Borrowed Books</span>
            </button>
          )}

          <button
            onClick={() => {
              dispatch(toggleSettingPopup());
              if (window.innerWidth < 768) setIsSideBarOpen(false);
            }}
            className="w-full py-2 font-medium rounded-md flex items-center space-x-2 hover:translate-x-1 transition-transform duration-300"
          >
            <img src={settingIcon} alt="setting" />
            <span>Update Credentials</span>
          </button>
        </nav>

        {/* Logout */}
        <div className="px-6 py-4">
          <button
            className="py-2 font-medium flex items-center justify-center space-x-5 mx-auto hover:translate-x-1 transition-transform duration-300"
            onClick={handleLogout}
          >
            <img src={logoutIcon} alt="logout" />
            <span>Log Out</span>
          </button>
        </div>

        {/* Close icon for mobile */}
        <img
          src={closeIcon}
          alt="closeIcon"
          onClick={() => setIsSideBarOpen(!isSideBarOpen)}
          className="h-fit w-fit absolute top-0 right-4 mt-4 block md:hidden cursor-pointer"
        />
      </aside>

      {/* Popups */}
      {addNewAdminPopup && <AddNewAdmin />}
      {settingPopup && <SettingPopup />}
    </>
  );
};

export default SideBar;
