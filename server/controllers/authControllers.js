import {catchAsyncErrors} from "../middlewares/catchAsyncErrors.js"
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { User } from "../models/userModels.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";
import { sendToken } from "../utils/sendToken.js";
// import { send } from "process";
import { generatePasswordResetEmailTemplate } from "../utils/emailTemplates.js";
import { sendEmail } from "../utils/sendEmail.js";

export const register = catchAsyncErrors(async(req, res, next) => {
    try {
        const {name , email, password} = req.body;
        console.log("📝 Registration attempt:", { name, email });
        
        if(!name || !email || !password){
            return next(new ErrorHandler("Please enter all fields.",400));
        }
        
        // Check if user is already verified
        const isRegistered = await User.findOne({email, accountVerified:true})
        if(isRegistered){
            return next(new ErrorHandler("User already registered.",400));
        }
        
        // Check registration attempts
        const registerationAttempsByUser = await User.find({
            email,
            accountVerified: false,
        })
        if(registerationAttempsByUser.length >= 5){
            return next(new ErrorHandler("You have exceeded the number of registration attempts. Please Contact support.",400));
        }
        
        // Validate password
        if(password.length<8 || password.length > 16){
            return next(new ErrorHandler("Password must be between 8 and 16 characters.",400));
        }
        
        // Create user
        const hashedPassword = await bcrypt.hash(password,10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        })
        
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
        sendToken(user, 200,"Account verified successfully.", res);

    } catch (error) {
        console.error("❌ OTP verification error:", error);
        return next(new ErrorHandler("Internal server error. Please try again.", 500));
    }
});

export const login = catchAsyncErrors(async(req, res, next) => {
    const {email, password} = req.body;
    if(!email || !password){
        return next(new ErrorHandler("Please enter all fields.",400));
    }
    const user = await User.findOne({email, accountVerified:true}).select("+password");
    if(!user){
        return next(new ErrorHandler("Invalid email or password.",400));
    }
    const isPasswordMatched = await bycrypt.compare(password, user.password);
    if(!isPasswordMatched){
        return next(new ErrorHandler("Invalid email or password.",400));
    }
    sendToken(user, 200,"User login successfully.", res);
});

export const logout = catchAsyncErrors(async(req, res, next) => {
    res.status(200).cookie("token", "",{
        expires: new Date(Date.now()),
        httpOnly: true,
        secure: true,
        sameSite: "None"
    }).json({
        success: true,
        message: "Logged out successfully.",
    });
});

export const getUser = catchAsyncErrors(async(req, res, next) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        user,
    });
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

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
    const message = generatePasswordResetEmailTemplate(resetPasswordUrl);

    try {
        
        await sendEmail({
            email: user.email,
            subject: "LibraFlow Library Management System Password Recovery",
            message,
        });

        res.status(200).json({
            success: true,
            message: {text: `Email sent to: ${user.email} successfully.`, token: resetToken},
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
    const hashedPassword = await bycrypt.hash(req.body.password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    await user.save();
    sendToken(user, 200,"Password reset successfully.", res);
});

export const updatePassword = catchAsyncErrors(async(req, res, next) => {
    const user = await User.findById(req.user._id).select("+password");
    const {currentPassword,newPassword, confirmNewPassword} = req.body;
    if(!currentPassword || !newPassword || !confirmNewPassword){
        return next(new ErrorHandler("Please enter all fields.",400));
    }
    const isPasswordMatched = await bycrypt.compare(currentPassword, user.password);
    if(!isPasswordMatched){
        return next(new ErrorHandler("Current password is incorrect.",400));
    }
    if(newPassword.length < 8 || newPassword.length > 16 || confirmNewPassword.length < 8 || confirmNewPassword.length > 16){
        return next(new ErrorHandler("Password must be between 8 and 16 characters.",400));
    }
    if(newPassword !== confirmNewPassword){
        return next(new ErrorHandler("New Password and Confirm New Password does not match.",400)); 
    }

    const hashedPassword = await bycrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({
        success: true,
        message: "Password updated successfully."
    });
});