import nodemailer from "nodemailer";
import envConfig from "../config/environment.js";

export const sendEmail = async({email, subject, message}) => {
    try {
        // Get email configuration from enhanced environment config
        const emailConfig = envConfig.getEmailConfig();
        
        // Verify SMTP configuration
        if (!emailConfig.auth.user || !emailConfig.auth.pass) {
            throw new Error("SMTP configuration is missing. Please check your environment variables.");
        }

        const transporter = nodemailer.createTransporter({
            host: emailConfig.host,
            service: emailConfig.service,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: {
                user: emailConfig.auth.user,
                pass: emailConfig.auth.pass,
            },
        });

        // Verify transporter configuration
        await transporter.verify();

        const mailOptions = {
            from: `${emailConfig.from.name} <${emailConfig.from.address}>`,
            to: email,
            subject: subject,
            html: message,
            replyTo: emailConfig.from.address,
        };

        const result = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent successfully:", result.messageId);
        return result;
    } catch (error) {
        console.error("❌ Email sending failed:", error.message);
        if (error.code === 'EAUTH') {
            throw new Error("Email authentication failed. Please check your Gmail app password.");
        }
        throw error;
    }
};