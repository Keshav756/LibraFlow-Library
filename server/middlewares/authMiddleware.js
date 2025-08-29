import jwt from "jsonwebtoken";
import { User } from "../models/userModels.js";
import ErrorHandler from "./errorMiddlewares.js";
import { catchAsyncErrors } from "./catchAsyncErrors.js";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  let token;

  // Check Authorization header or cookie
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ErrorHandler("Unauthorized. No token provided.", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = await User.findById(decoded.id).select(
      "-password -resetPasswordToken -resetPasswordTokenExpire"
    );

    if (!req.user) return next(new ErrorHandler("User not found", 404));

    next();
  } catch (error) {
    console.error("❌ JWT verification failed:", error.message);
    return next(new ErrorHandler("Invalid or expired token", 401));
  }
});

// Optional: role-based authorization
export const isAuthorized = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new ErrorHandler("You are not authorized to access this resource", 403)
    );
  }
  next();
};
