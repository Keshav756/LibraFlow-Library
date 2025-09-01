import nodemailer from "nodemailer";

export const sendEmail = async({email, subject, message}) => {
    try {
        // Verify SMTP configuration
        if (!process.env.SMTP_MAIL || !process.env.SMTP_PASSWORD) {
            throw new Error("SMTP configuration is missing");
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            service: process.env.SMTP_SERVICE,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        // Verify transporter configuration
        await transporter.verify();

        const mailOptions = {
            from: process.env.SMTP_MAIL,
            to: email,
            subject: subject,
            html: message,
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