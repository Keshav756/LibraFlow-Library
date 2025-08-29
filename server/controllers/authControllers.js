import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { User } from "../models/userModels.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";
import { sendToken } from "../utils/sendToken.js";
import { generatePasswordResetEmailTemplate } from "../utils/emailTemplates.js";
import { sendEmail } from "../utils/sendEmail.js";

// ===== REGISTER =====
export const register = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password } = req.body;
    console.log("📝 Registration attempt:", { name, email });

    if (!name || !email || !password) {
        return next(new ErrorHandler("Please enter all fields.", 400));
    }

    const isRegistered = await User.findOne({ email, accountVerified: true });
    if (isRegistered) return next(new ErrorHandler("User already registered.", 400));

    const registrationAttempts = await User.countDocuments({ email, accountVerified: false });
    if (registrationAttempts >= 5) {
        return next(new ErrorHandler("Exceeded registration attempts. Contact support.", 400));
    }

    if (password.length < 8 || password.length > 16) {
        return next(new ErrorHandler("Password must be between 8 and 16 characters.", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const verificationCode = user.generateVerificationCode();
    await user.save();

    console.log(`✅ User created with verification code: ${verificationCode}`);

    try {
        console.log(`📧 Sending verification email to ${email}...`);
        await sendVerificationCode(verificationCode, email, res);
        console.log(`✅ Verification email sent to ${email}`);
    } catch (emailError) {
        await User.findByIdAndDelete(user._id);
        console.error("❌ Email sending failed, user deleted:", emailError.message);
        return next(new ErrorHandler("Failed to send verification email. Check your email address.", 500));
    }
});

// ===== VERIFY OTP =====
export const verifyOTP = catchAsyncErrors(async (req, res, next) => {
    const { email, otp } = req.body;
    if (!email || !otp) return next(new ErrorHandler("Email or OTP missing.", 400));

    const unverifiedUsers = await User.find({ email, accountVerified: false }).sort({ createdAt: -1 });
    if (!unverifiedUsers.length) return next(new ErrorHandler("User not found. Register first.", 404));

    let user = unverifiedUsers[0];
    if (unverifiedUsers.length > 1) {
        await User.deleteMany({ _id: { $ne: user._id }, email, accountVerified: false });
    }

    if (user.verificationCode !== Number(otp)) {
        return next(new ErrorHandler("Invalid OTP. Check your email.", 400));
    }

    if (Date.now() > user.verificationCodeExpire.getTime()) {
        return next(new ErrorHandler("OTP expired. Request a new verification code.", 400));
    }

    user.accountVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpire = null;
    await user.save({ validateModifiedOnly: true });

    console.log(`✅ User ${email} verified successfully`);
    sendToken(user, 200, "Account verified successfully.", res);
});

// ===== LOGIN =====
export const login = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) return next(new ErrorHandler("Please enter all fields.", 400));

    const user = await User.findOne({ email, accountVerified: true }).select("+password");
    if (!user) return next(new ErrorHandler("Invalid email or password.", 400));

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) return next(new ErrorHandler("Invalid email or password.", 400));

    sendToken(user, 200, "User login successfully.", res);
});

// ===== LOGOUT =====
export const logout = catchAsyncErrors(async (req, res) => {
    res.status(200).cookie("token", "", {
        expires: new Date(Date.now()),
        httpOnly: true,
        secure: true,
        sameSite: "None"
    }).json({ success: true, message: "Logged out successfully." });
});

// ===== GET CURRENT USER =====
export const getUser = catchAsyncErrors(async (req, res) => {
    res.status(200).json({ success: true, user: req.user });
});

// ===== FORGOT PASSWORD =====
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
    const { email } = req.body;
    if (!email) return next(new ErrorHandler("Please enter email.", 400));

    const user = await User.findOne({ email, accountVerified: true });
    if (!user) return next(new ErrorHandler("User not found.", 404));

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: true });

    const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
    const message = generatePasswordResetEmailTemplate(resetUrl);

    try {
        await sendEmail({ email: user.email, subject: "Password Recovery", message });
        res.status(200).json({ success: true, message: `Email sent to ${user.email} successfully.` });
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new ErrorHandler(err.message, 500));
    }
});

// ===== RESET PASSWORD =====
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) return next(new ErrorHandler("Please enter all fields.", 400));
    if (password !== confirmPassword) return next(new ErrorHandler("Passwords do not match.", 400));
    if (password.length < 8 || password.length > 16) return next(new ErrorHandler("Password must be 8-16 characters.", 400));

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordTokenExpire: { $gt: Date.now() }
    });

    if (!user) return next(new ErrorHandler("Reset token invalid or expired.", 400));

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    await user.save();

    sendToken(user, 200, "Password reset successfully.", res);
});

// ===== UPDATE PASSWORD =====
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user._id).select("+password");
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        return next(new ErrorHandler("Please enter all fields.", 400));
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return next(new ErrorHandler("Current password is incorrect.", 400));
    if (newPassword !== confirmNewPassword) return next(new ErrorHandler("New passwords do not match.", 400));
    if (newPassword.length < 8 || newPassword.length > 16) return next(new ErrorHandler("Password must be 8-16 characters.", 400));

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully." });
});