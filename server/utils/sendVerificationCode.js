import { generateVerificationOtpEmailTemplate } from "./emailTemplates.js";
import sendEmail from "./sendEmail.js";

export async function sendVerificationCode(verificationCode, email) {
    try {
        const message = generateVerificationOtpEmailTemplate(verificationCode);
        
        await sendEmail({
            email,
            subject: "Verification Code (LibraFlow Library Management System)",
            message,
        });
        
        console.log(`✅ Verification code ${verificationCode} sent to ${email}`);
        return { success: true, message: "Verification code sent successfully." };
    } catch (error) {
        console.error("❌ Error sending verification code:", error);
        throw new Error("Verification code failed to send. Please try again.");
    }
}