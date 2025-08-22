import React, { useEffect, useState } from "react";
import settingIcon from "../assets/setting.png";
import userIcon from "../assets/user.png";
import { useSelector, useDispatch } from "react-redux";
import { toggleSettingPopup } from "../store/slices/popupSlice";
import { toast } from "react-toastify";


const Header = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      const hours = now.getHours() % 12 || 12; // Convert to 12-hour format
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = now.getHours() >= 12 ? "PM" : "AM";
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
      const options = { year: "numeric", month: "short", day: "numeric" };
      setCurrentDate(now.toLocaleDateString("en-US", options));
    };
    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <header className="absolute top-0 left-0 bg-white w-full py-4 px-6 shadow-md flex justify-between items-center">
        {/* Left Side */}
        <div className="flex items-center gap-2">
          <img src={userIcon} alt="userIcon" className="w-8 h-8 " />
          <div className="flex flex-col">
            <span className="text-sm font-medium sm:text-lg lg:text-xl sm:font-semibold">
              {user && user.name}
            </span>
            <span className="text-sm font-medium sm:text-lg sm:font-medium">
              {user && user.role}
            </span>
          </div>
        </div>
        {/* Right Side */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex flex-col text-sm lg:text-base items-end font-semibold">
            <span>{currentTime}</span>
            <span>{currentDate}</span>
          </div>
          <span className="bg-black h-14 w-[2px] " />
          <img
            src={settingIcon}
            alt="settingIcon"
            className="w-8 h-8 cursor-pointer"
            onClick={() => dispatch(toggleSettingPopup())}
          />
        </div>
      </header>
    </>
  );
};

export default Header;
