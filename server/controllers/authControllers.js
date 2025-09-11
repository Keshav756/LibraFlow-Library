// Enhanced authentication controllers with improved efficiency and security
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { User } from "../models/userModels.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";
import { sendToken, clearToken } from "../utils/sendToken.js";
import { generatePasswordResetEmailTemplate } from "../utils/emailTemplates.js";
import { sendEmail } from "../utils/sendEmail.js";
import envConfig from "../config/environment.js";

// Constants for better maintainability and security
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128; // Increased max length for passphrases
const MAX_REGISTRATION_ATTEMPTS = 5;
const BCRYPT_SALT_ROUNDS = 12; // Increased for better security

/**
 * Enhanced password validation with detailed feedback
 */
const validatePassword = (password) => {
    if (!password) return { isValid: false, message: "Password is required." };
    if (password.length < PASSWORD_MIN_LENGTH) {
        return { isValid: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.` };
    }
    if (password.length > PASSWORD_MAX_LENGTH) {
        return { isValid: false, message: `Password must not exceed ${PASSWORD_MAX_LENGTH} characters.` };
    }
    
    // Enhanced password strength validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    // Check for common weak passwords
    const commonPasswords = [
        'password', '12345678', 'qwerty', 'admin', 'welcome',
        'password123', 'admin123', 'qwerty123'
    ];
    
    const isCommonPassword = commonPasswords.some(common => 
        password.toLowerCase().includes(common));
    
    if (isCommonPassword) {
        return {
            isValid: false,
            message: "Password is too common. Please choose a stronger password."
        };
    }
    
    // Check for sequential characters
    const hasSequential = /(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password);
    
    if (hasSequential) {
        return {
            isValid: false,
            message: "Password contains sequential characters. Please choose a stronger password."
        };
    }
    
    // Check for repeated characters
    const hasRepeated = /(.)\1{2,}/.test(password);
    
    if (hasRepeated) {
        return {
            isValid: false,
            message: "Password contains too many repeated characters. Please choose a stronger password."
        };
    }
    
    // Strong password should have at least 3 of the 4 character types
    const charTypes = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar];
    const charTypeCount = charTypes.filter(Boolean).length;
    
    if (charTypeCount < 3) {
        return { 
            isValid: false, 
            message: "Password must contain at least 3 of the following: uppercase letters, lowercase letters, numbers, and special characters." 
        };
    }
    
    return { isValid: true, message: "Password is valid." };
};

/**
 * Enhanced email validation
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const register = catchAsyncErrors(async(req, res, next) => {
    try {
        const {name , email, password} = req.body;
        console.log("📝 Registration attempt:", { name, email });
        
        // Enhanced input validation
        if (!name?.trim() || !email?.trim() || !password) {
            return next(new ErrorHandler("Please provide all required fields: name, email, and password.", 400));
        }
        
        // Validate email format
        if (!isValidEmail(email)) {
            return next(new ErrorHandler("Please provide a valid email address.", 400));
        }
        
        // Validate name length
        if (name.trim().length < 2 || name.trim().length > 50) {
            return next(new ErrorHandler("Name must be between 2 and 50 characters.", 400));
        }
        
        // Enhanced password validation
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return next(new ErrorHandler(passwordValidation.message, 400));
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        
        // Check if user is already verified
        const isRegistered = await User.findOne({ email: normalizedEmail, accountVerified: true });
        if (isRegistered) {
            return next(new ErrorHandler("An account with this email is already registered. Please login instead.", 400));
        }
        
        // Check registration attempts with better performance
        const registrationAttempts = await User.countDocuments({
            email: normalizedEmail,
            accountVerified: false,
        });
        
        if (registrationAttempts >= MAX_REGISTRATION_ATTEMPTS) {
            // Clean up old attempts
            await User.deleteMany({
                email: normalizedEmail,
                accountVerified: false,
                createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Older than 24 hours
            });
            
            return next(new ErrorHandler(
                "Maximum registration attempts exceeded. Please contact support or try again after 24 hours.", 
                429
            ));
        }
        
        // Create user with enhanced security
        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
        });
        
        // Generate verification code
        const verificationCode = await user.generateVerificationCode();
        await user.save();
        
        console.log(`✅ User created with verification code: ${verificationCode}`);
        
        // Send verification email
        try {
            console.log(`📧 Sending verification email to ${email}...`);
            await sendVerificationCode(verificationCode, email, res);
            console.log(`✅ Verification email sent successfully to ${email}`);
        } catch (emailError) {
            // If email fails, delete the user and return error
            await User.findByIdAndDelete(user._id);
            console.error("❌ Email sending failed, user deleted:", emailError.message);
            return next(new ErrorHandler("Failed to send verification email. Please check your email address and try again.", 500));
        }
        
    } catch (error) {
        console.error("❌ Registration error:", error);
        next(error);
    }
} );

export const verifyOTP = catchAsyncErrors(async(req, res, next) => {
    const {email, otp} = req.body;
    console.log("🔐 OTP verification attempt:", { email, otp });
    
    if(!email || !otp){
        return next(new ErrorHandler("Email or OTP is missing. Please enter all fields.",400));
    }
    
    try {
        const userAllentries = await User.find({
            email, 
            accountVerified: false
        }).sort({createdAt: -1});
        
        console.log(`📊 Found ${userAllentries.length} unverified users for email: ${email}`);
        
        if(!userAllentries.length){
            return next(new ErrorHandler("User not found. Please register first.",404));
        }
        
        let user;
        if(userAllentries.length > 1){
            user = userAllentries[0];
            await User.deleteMany({
              _id: { $ne: user._id },
                email,
                accountVerified: false,
            });
        }else{
            user = userAllentries[0];
        }

        console.log(`🔍 User verification code: ${user.verificationCode}, Provided OTP: ${otp}`);
        
        if(user.verificationCode !== Number(otp)){
            return next(new ErrorHandler("Invalid OTP. Please check your email and try again.", 400));
        }

        const currentTime = Date.now();
        const verificationCodeTime = user.verificationCodeExpire.getTime();

        if(currentTime > verificationCodeTime){
            return next(new ErrorHandler("OTP expired. Please request a new verification code.", 400));
        }
        
        user.accountVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpire = null;
        await user.save({validateModifiedOnly: true});

        console.log(`✅ User ${email} verified successfully`);
        sendToken(user, 200,"Account verified successfully.", res, req);

    } catch (error) {
        console.error("❌ OTP verification error:", error);
        return next(new ErrorHandler("Internal server error. Please try again.", 500));
    }
});

export const login = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;
    
    // Enhanced input validation
    if (!email?.trim() || !password) {
        return next(new ErrorHandler("Please provide both email and password.", 400));
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
        return next(new ErrorHandler("Please provide a valid email address.", 400));
    }
    
    try {
        const normalizedEmail = email.toLowerCase().trim();
        
        // Find user with enhanced error handling
        const user = await User.findOne({ 
            email: normalizedEmail, 
            accountVerified: true 
        }).select("+password");
        
        if (!user) {
            return next(new ErrorHandler("Invalid email or password.", 401));
        }
        
        // Compare password with timing attack protection
        const isPasswordMatched = await bcrypt.compare(password, user.password);
        if (!isPasswordMatched) {
            return next(new ErrorHandler("Invalid email or password.", 401));
        }
        
        console.log(`✅ User ${normalizedEmail} logged in successfully`);
        sendToken(user, 200, "Login successful. Welcome back!", res, req);
        
    } catch (error) {
        console.error("❌ Login error:", error);
        return next(new ErrorHandler("Login failed. Please try again.", 500));
    }
});

export const logout = catchAsyncErrors(async (req, res, next) => {
    try {
        // Use the enhanced clearToken function for secure logout
        clearToken(res, req);
        
        // Log security event
        console.log(`🔐 User logged out: ${req.user?.email || 'unknown'} - Session terminated securely`);
        
        res.status(200).json({
            success: true,
            message: "Logged out successfully. Thank you for using LibraFlow!",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("❌ Logout error:", error);
        return next(new ErrorHandler("Logout failed. Please try again.", 500));
    }
});

export const getUser = catchAsyncErrors(async (req, res, next) => {
    try {
        const user = req.user;
        
        if (!user) {
            return next(new ErrorHandler("User not found. Please login again.", 404));
        }
        
        res.status(200).json({
            success: true,
            user,
            message: "User profile retrieved successfully."
        });
    } catch (error) {
        console.error("❌ Get user error:", error);
        return next(new ErrorHandler("Failed to retrieve user profile.", 500));
    }
});

export const forgotPassword = catchAsyncErrors(async(req, res, next) => {

    if(!req.body.email) {
        return next(new ErrorHandler("Please enter all fields.", 400));
    }

    const user = await User.findOne({
        email: req.body.email,
        accountVerified: true,
    });
    if (!user) {
        return next(new ErrorHandler("User not found.", 404));
    }
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: true });

    const serverConfig = envConfig.getServerConfig();
    const resetPasswordUrl = `${serverConfig.frontendUrl}/password/reset/${resetToken}`;
    const message = generatePasswordResetEmailTemplate(resetPasswordUrl);

    try {
        
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
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpire = undefined;
        await user.save({ validateBeforeSave: false});
        return next(new ErrorHandler(error.message, 500));
    }

});

export const resetPassword = catchAsyncErrors(async(req, res, next) => {
    const {token} = req.params;
    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordTokenExpire: {$gt: Date.now()},
    });
    if(!user){
        return next(new ErrorHandler("Reset password token is invalid or expired.", 400));
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler("Password does not match.", 400));
    }

    if(req.body.password.length < 8 || req.body.password.length > 16 || req.body.confirmPassword.length < 8 || req.body.confirmPassword.length > 16){
        return next(new ErrorHandler("Password must be between 8 and 16 characters.",400));
    }
    const hashedPassword = await bcrypt.hash(req.body.password, BCRYPT_SALT_ROUNDS);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    await user.save();
    sendToken(user, 200,"Password reset successfully.", res, req);
});

export const updatePassword = catchAsyncErrors(async(req, res, next) => {
    const user = await User.findById(req.user._id).select("+password");
    const {currentPassword,newPassword, confirmNewPassword} = req.body;
    if(!currentPassword || !newPassword || !confirmNewPassword){
        return next(new ErrorHandler("Please enter all fields.",400));
    }
    const isPasswordMatched = await bcrypt.compare(currentPassword, user.password);
    if(!isPasswordMatched){
        return next(new ErrorHandler("Current password is incorrect.",400));
    }
    if(newPassword.length < 8 || newPassword.length > 16 || confirmNewPassword.length < 8 || confirmNewPassword.length > 16){
        return next(new ErrorHandler("Password must be between 8 and 16 characters.",400));
    }
    if(newPassword !== confirmNewPassword){
        return next(new ErrorHandler("New Password and Confirm New Password does not match.",400)); 
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({
        success: true,
        message: "Password updated successfully."
    });
});