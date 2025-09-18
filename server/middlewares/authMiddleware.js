import { catchAsyncErrors } from "./catchAsyncErrors.js";
import jwt from "jsonwebtoken";
import ErrorHandler from "./errorMiddlewares.js";
import { User } from "../models/userModels.js";

// Middleware to check if user is authenticated
export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  // Try to get token from cookies first, then from Authorization header
  let token = req.cookies.token;
  
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return next(new ErrorHandler("User is not authenticated.", 400));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return next(new ErrorHandler("User not found with this token.", 404));
    }

    next();
  } catch (error) {
    return next(new ErrorHandler("Invalid or expired token.", 401));
  }
});

// Middleware to authorize based on role (case-insensitive)
export const isAuthorized = (requiredRole) => {
  return (req, res, next) => {
    if (
      !req.user ||
      req.user.role.toLowerCase() !== requiredRole.toLowerCase()
    ) {
      return next(
        new ErrorHandler(
          `Role: (${req.user?.role}) is not allowed to access this resource.`,
          403
        )
      );
    }
    next();
  };
};