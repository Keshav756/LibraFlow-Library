// middlewares/auth.js
import { catchAsyncErrors } from "./catchAsyncErrors.js";
import jwt from "jsonwebtoken";
import ErrorHandler from "./errorMiddlewares.js";
import { User } from "../models/userModels.js";

// Middleware to check if user is logged in
export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  // Extract token from cookies
  const token = req.cookies?.token;

  if (!token) {
    return next(new ErrorHandler("User not authenticated", 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    return next(new ErrorHandler("Invalid or expired token", 401));
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Attach user to request
  req.user = {
    _id: user._id,
    email: user.email.toLowerCase(),
    role: user.role,
    name: user.name,
    full: user, // keep full object if needed
  };

  next();
});

// Middleware for role-based authorization
export const isAuthorized = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role.toLowerCase())) {
      return next(
        new ErrorHandler(
          `Role '${req.user?.role}' is not authorized to access this resource`,
          403
        )
      );
    }
    next();
  };
};
