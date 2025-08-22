import { catchAsyncErrors } from "./catchAsyncErrors.js";
import jwt from "jsonwebtoken";
import ErrorHandler from "./errorMiddlewares.js";
import { User } from "../models/userModels.js";

// Middleware to check if user is authenticated
export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("User is not authenticated.", 400));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    return next(new ErrorHandler("Invalid or expired token.", 401));
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new ErrorHandler("User not found with this token.", 404));
  }

  // Attach minimal info + full user object
  req.user = {
    _id: user._id,
    email: user.email?.toLowerCase(),
    role: user.role,
    name: user.name,
    full: user, // keep original full object if needed
  };

  next();
});

// Middleware to authorize based on role (case-insensitive)
export const isAuthorized = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || req.user.role?.toLowerCase() !== requiredRole.toLowerCase()) {
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
