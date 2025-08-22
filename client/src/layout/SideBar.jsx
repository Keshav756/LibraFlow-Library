import React from "react";
import { useEffect } from "react";
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
import { logout, resetAuthSlice } from "../store/slices/authSlice";
import { toast } from "react-toastify";
import {
  toggleAddNewAdminPopup,
  toggleSettingPopup,
} from "../store/slices/popupSlice";
import AddNewAdmin from "../popups/AddNewAdmin";
import SettingPopup from "../popups/SettingPopup";

const SideBar = ({ isSideBarOpen, setIsSideBarOpen, setSelectedComponent }) => {
  const handleComponentSelect = (componentName) => {
    setSelectedComponent(componentName);
    // Close sidebar on mobile devices when a component is selected
    if (window.innerWidth < 768) { // 768px is the md breakpoint
      setIsSideBarOpen(false);
    }
  };
  const dispatch = useDispatch();
  const { addNewAdminPopup, settingPopup } = useSelector((state) => state.popup);

  const { loading, error, message, isAuthenticated, user } = useSelector(
    (state) => state.auth
  );

  const handleLogout = () => {
    dispatch(logout());
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(resetAuthSlice());
    }

    if (message) {
      toast.success(message);
      dispatch(resetAuthSlice());
    }
  }, [dispatch, isAuthenticated, error, loading, message]);

  return (
    <>
      <aside
        className={`${
          isSideBarOpen ? "left-0" : "-left-full"
        } z-10 transition-all duration-700 md:relative md:left-0 flex w-64 bg-black text-white flex-col h-full animate-slide-in-left`}
        style={{ position: "fixed" }}
      >
        <div className="px-6 py-4 my-8">
          <img src={logo_with_title} alt="logo" />
        </div>
        <nav className="flex-1 px-6 space-y-2">
          <button
            onClick={() => handleComponentSelect("Dashboard")}
            className="w-full py-2 font-medium bg-transparent rounded-md hover:cursor-pointer flex items-center space-x-2 transition-transform duration-300 hover:translate-x-1"
          >
            <img src={dashboardIcon} alt="dashboard" /> <span>Dashboard</span>
          </button>
          <button
            onClick={() => handleComponentSelect("Books")}
            className="w-full py-2 font-medium bg-transparent rounded-md hover:cursor-pointer flex items-center space-x-2"
          >
            <img src={bookIcon} alt="books" /> <span>Books</span>
          </button>
          {isAuthenticated && user?.role === "Admin" && (
            <>
              <button
                onClick={() => handleComponentSelect("Catalog")}
                className="w-full py-2 font-medium bg-transparent rounded-md hover:cursor-pointer flex items-center space-x-2"
              >
                <img src={catalogIcon} alt="catalog" /> <span>Catalog</span>
              </button>
              <button
                onClick={() => handleComponentSelect("Users")}
                className="w-full py-2 font-medium bg-transparent rounded-md hover:cursor-pointer flex items-center space-x-2"
              >
                <img src={usersIcon} alt="users" /> <span>Users</span>
              </button>
              <button
                onClick={() => {
                  dispatch(toggleAddNewAdminPopup());
                  // Close sidebar on mobile devices when Add New Admin is clicked
                  if (window.innerWidth < 768) {
                    setIsSideBarOpen(false);
                  }
                }}
                className="w-full py-2 font-medium bg-transparent rounded-md hover:cursor-pointer flex items-center space-x-2"
              >
                <RiAdminFill className="w-6 h-6" /> <span>Add New Admin</span>
              </button>
            </>
          )}
          {isAuthenticated && user?.role === "User" && (
            <button
              onClick={() => handleComponentSelect("My Borrowed Books")}
              className="w-full py-2 font-medium bg-transparent rounded-md hover:cursor-pointer flex items-center space-x-2"
            >
              <img src={catalogIcon} alt="my-borrowed-books" />
              <span>My Borrowed Books</span>
            </button>
          )}
          <button
            onClick={() => {
              dispatch(toggleSettingPopup());
              // Close sidebar on mobile devices when Update Credentials is clicked
              if (window.innerWidth < 768) {
                setIsSideBarOpen(false);
              }
            }}
            className="w-full py-2 font-medium bg-transparent rounded-md hover:cursor-pointer flex items-center space-x-2"
          >
            <img src={settingIcon} alt="setting" />
            <span>Update Credentials</span>
          </button>
        </nav>
        <div className="px-6 py-4">
          <button
            className="py-2 font-medium text-center bg-transparent rounded-md hover:cursor-pointer flex items-center justify-center space-x-5 mb-7 mx-auto w-fit"
            onClick={handleLogout}
          >
            <img src={logoutIcon} alt="logout" /> <span>Log Out</span>
          </button>
        </div>
        <img
          src={closeIcon}
          alt="closeIcon"
          onClick={() => setIsSideBarOpen(!isSideBarOpen)}
          className="h-fit w-fit absolute top-0 right-4 mt-4 block md:hidden"
        />
      </aside>
      {addNewAdminPopup && <AddNewAdmin />}
      {settingPopup && <SettingPopup />}
    </>
  );
};

export default SideBar;
