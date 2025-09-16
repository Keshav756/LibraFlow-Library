import { generateVerificationOtpEmailTemplate } from "./emailTemplates.js";
import sendEmail from "./sendEmail.js";

export async function sendVerificationCode(verificationCode, email) {
    try {
        const message = generateVerificationOtpEmailTemplate(verificationCode);
        
        // Add timeout to prevent hanging
        const emailPromise = sendEmail({
            email,
            subject: "Verification Code (LibraFlow Library Management System)",
            message,
        });
        
        // Set 30 second timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Email sending timeout')), 30000);
        });
        
        await Promise.race([emailPromise, timeoutPromise]);
        
        console.log(`✅ Verification code ${verificationCode} sent to ${email}`);
        return { success: true, message: "Verification code sent successfully." };
    } catch (error) {
        console.error("❌ Error sending verification code:", error);
        throw new Error(error.message === 'Email sending timeout' 
            ? "Email sending timed out. Please try again." 
            : "Verification code failed to send. Please try again.");
    }
}