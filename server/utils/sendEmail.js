import nodemailer from "nodemailer";

/**
 * Send email using Nodemailer with Gmail/SMTP
 * Supports dynamic secure flag & better error handling
 */
const sendEmail = async (options) => {
  try {
    // Check if env variables are present
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_MAIL || !process.env.SMTP_PASSWORD) {
      throw new Error("❌ Missing SMTP environment variables. Please check your .env file.");
    }

    const port = parseInt(process.env.SMTP_PORT, 10);
    const isSecure = port === 465; // Only secure if using 465

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      service: process.env.SMTP_SERVICE,
      port,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Debug: Log SMTP setup (without showing password)
    console.log("📧 [SMTP CONFIG]", {
      host: process.env.SMTP_HOST,
      service: process.env.SMTP_SERVICE,
      port,
      secure: isSecure,
      mail: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD ? "✔️ Present" : "❌ Missing",
    });

    // Verify transporter connection
    await transporter.verify({ timeout: 25000 });
    console.log("✅ Email service verified and ready to send");

    // Mail options
    const mailOptions = {
      from: `LibraFlow <${process.env.SMTP_MAIL}>`,
      to: options.email,
      subject: options.subject,
      html: options.message,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions, { timeout: 30000 });
    console.log("✅ Email sent successfully:", info.messageId);

    return info;
  } catch (error) {
    console.error("❌ Email sending failed:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw new Error("Email could not be sent. " + error.message);
  }
};

export default sendEmail;