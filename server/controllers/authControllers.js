import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { User } from "../models/userModels.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";
import { sendToken } from "../utils/sendToken.js";
import { generatePasswordResetEmailTemplate } from "../utils/emailTemplates.js";
import sendEmail from "../utils/sendEmail.js";

/* ========================================================
   REGISTER
======================================================== */
export const register = catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    console.log("📝 Registration attempt:", { name, email });

    if (!name || !email || !password) {
      return next(new ErrorHandler("Please enter all fields.", 400));
    }

    // Already registered?
    const isRegistered = await User.findOne({ email, accountVerified: true });
    if (isRegistered) {
      return next(new ErrorHandler("User already registered.", 400));
    }

    // Too many unverified attempts?
    const registerationAttempsByUser = await User.find({
      email,
      accountVerified: false,
    });
    if (registerationAttempsByUser.length >= 5) {
      return next(
        new ErrorHandler(
          "You have exceeded the number of registration attempts. Please contact support.",
          400
        )
      );
    }

    // Strong password validation (8–16 chars, 1 uppercase, 1 number, 1 special char)
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
    if (!passwordRegex.test(password)) {
      return next(
        new ErrorHandler(
          "Password must be 8–16 characters, include 1 uppercase, 1 number, and 1 special character.",
          400
        )
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    console.log("✅ User created:", user._id);

    // Generate verification code
    const verificationCode = await user.generateVerificationCode();
    await user.save();

    // Send verification email
    try {
      await sendVerificationCode(verificationCode, email);
      console.log(`✅ Verification email sent to ${email}`);
      res.status(200).json({
        success: true,
        message:
          "User registered successfully. Please check your email for verification code.",
      });
    } catch (emailError) {
      await User.findByIdAndDelete(user._id); // cleanup if email fails
      return next(
        new ErrorHandler(
          "Failed to send verification email. Please try again later.",
          500
        )
      );
    }
  } catch (error) {
    console.error("❌ Registration error:", error);
    next(error);
  }
});

/* ========================================================
   VERIFY OTP
======================================================== */
export const verifyOTP = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return next(
      new ErrorHandler("Email or OTP is missing. Please enter all fields.", 400)
    );
  }

  try {
    const userAllentries = await User.find({
      email,
      accountVerified: false,
    }).sort({ createdAt: -1 });

    if (!userAllentries.length) {
      return next(
        new ErrorHandler("User not found. Please register first.", 404)
      );
    }

    let user;
    if (userAllentries.length > 1) {
      user = userAllentries[0];
      await User.deleteMany({
        _id: { $ne: user._id },
        email,
        accountVerified: false,
      });
    } else {
      user = userAllentries[0];
    }

    if (user.verificationCode !== Number(otp)) {
      return next(
        new ErrorHandler(
          "Invalid OTP. Please check your email and try again.",
          400
        )
      );
    }

    if (Date.now() > user.verificationCodeExpire.getTime()) {
      return next(
        new ErrorHandler("OTP expired. Please request a new verification code.", 400)
      );
    }

    user.accountVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpire = null;
    await user.save({ validateModifiedOnly: true });

    console.log(`✅ User ${email} verified successfully`);
    sendToken(user, 200, "Account verified successfully.", res);
  } catch (error) {
    console.error("❌ OTP verification error:", error);
    return next(
      new ErrorHandler("Internal server error. Please try again.", 500)
    );
  }
});

/* ========================================================
   LOGIN
======================================================== */
export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please enter all fields.", 400));
  }

  const user = await User.findOne({
    email,
    accountVerified: true,
  }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }

  sendToken(user, 200, "User login successful.", res);
});

/* ========================================================
   LOGOUT
======================================================== */
export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: true,
      sameSite: "None",
    })
    .json({
      success: true,
      message: "Logged out successfully.",
    });
});

/* ========================================================
   GET USER
======================================================== */
export const getUser = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

/* ========================================================
   FORGOT PASSWORD
======================================================== */
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.body.email) {
      return next(new ErrorHandler("Please enter all fields.", 400));
    }

    const user = await User.findOne({
      email: req.body.email,
      accountVerified: true,
    });

    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
    const message = generatePasswordResetEmailTemplate(resetPasswordUrl);

    await sendEmail({
      email: user.email,
      subject: "LibraFlow Library Management System Password Recovery",
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to: ${user.email} successfully.`,
    });
  } catch (error) {
    console.error("❌ Forgot Password Error:", error);
    return next(
      new ErrorHandler(
        "Failed to send password reset email. Please try again later.",
        500
      )
    );
  }
});

/* ========================================================
   RESET PASSWORD
======================================================== */
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler("Reset password token is invalid or expired.", 400)
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match.", 400));
  }

  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
  if (!passwordRegex.test(req.body.password)) {
    return next(
      new ErrorHandler(
        "Password must be 8–16 characters, include 1 uppercase, 1 number, and 1 special character.",
        400
      )
    );
  }

  user.password = await bcrypt.hash(req.body.password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpire = undefined;
  await user.save();

  sendToken(user, 200, "Password reset successfully.", res);
});

/* ========================================================
   UPDATE PASSWORD
======================================================== */
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(new ErrorHandler("Please enter all fields.", 400));
  }

  const isPasswordMatched = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Current password is incorrect.", 400));
  }

  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
  if (!passwordRegex.test(newPassword)) {
    return next(
      new ErrorHandler(
        "New password must be 8–16 characters, include 1 uppercase, 1 number, and 1 special character.",
        400
      )
    );
  }

  if (newPassword !== confirmNewPassword) {
    return next(
      new ErrorHandler("New Password and Confirm New Password do not match.", 400)
    );
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully.",
  });
});
