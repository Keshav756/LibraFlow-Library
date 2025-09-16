import { catchAsyncErrors } from "./catchAsyncErrors.js";
import jwt from "jsonwebtoken";
import ErrorHandler from "./errorMiddlewares.js";
import { User } from "../models/userModels.js";

// 🔹 Verify if user is logged in
export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("User not authenticated. Please log in.", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    // Attach user info to request
    req.user = {
      _id: user._id,
      email: user.email.toLowerCase(),
      role: user.role,
      name: user.name,
      full: user, // full user document if needed
    };

    next();
  } catch (error) {
    return next(new ErrorHandler("Invalid or expired token. Please log in again.", 401));
  }
});

// 🔹 Check if user has required role
export const isAuthorized = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role ${req.user?.role || "Unknown"} is not allowed to access this resource.`,
          403
        )
      );
    }
    next();
  };
};
