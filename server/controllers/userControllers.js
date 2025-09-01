import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userModels.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import bcrypt from "bcrypt"; // Correct import name
import { v2 as cloudinary } from "cloudinary"; // Ensure Cloudinary integration is set correctly

// Fetch all verified users
export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({ accountVerified: true });
  res.status(200).json({
    success: true,
    users,
  });
});

// Register a new admin
export const registerNewAdmin = catchAsyncErrors(async (req, res, next) => {
  // Check if the avatar is provided in the request
  if (!req.files || Object.keys(req.files).length === 0 || !req.files.avatar) {
    return next(new ErrorHandler("Admin avatar is required", 400));
  }

  const { name, email, password } = req.body;

  // Check if all fields are provided
  if (!name || !email || !password) {
    return next(new ErrorHandler("Please provide all fields", 400));
  }

  // Check if the user is already registered
  const isRegistered = await User.findOne({ email, accountVerified: true });
  if (isRegistered) {
    return next(new ErrorHandler("User already registered", 400));
  }

  // Validate password length
  if (password.length < 8 || password.length > 16) {
    return next(
      new ErrorHandler("Password should be between 8 to 16 characters long.", 400)
    );
  }

  const avatar = req.files.avatar; // Fixed typo `avtar` to `avatar`

  // Validate the file type of the avatar
  const allowedFormats = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(avatar.mimetype)) {
    return next(new ErrorHandler("Please upload a valid image", 400));
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Upload avatar image to Cloudinary
  const cloudinaryResponse = await cloudinary.uploader.upload(avatar.tempFilePath, {
    folder: "Library_Management_System_Avatars",
  });

  // Check for Cloudinary upload errors
  if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
    console.error("Cloudinary error:", cloudinaryResponse.error || "Unknown error");
    return next(new ErrorHandler("Failed to upload avatar image", 500));
  }

  // Create the new admin user
  const admin = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "Admin",
    accountVerified: true,
    avatar: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
  });

  // Send response with admin details
  res.status(201).json({
    success: true,
    message: "Admin registered successfully",
    admin: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      accountVerified: admin.accountVerified,
      avatar: admin.avatar, // Return avatar info here
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    },
  });
});