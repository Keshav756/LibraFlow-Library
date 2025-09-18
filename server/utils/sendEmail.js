import nodemailer from "nodemailer";

/**
 * Send email using Nodemailer with Gmail/SMTP
 * Fixed callback handling for better compatibility
 */
const sendEmail = async (options) => {
  try {
    // Check if env variables are present
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_MAIL || !process.env.SMTP_PASSWORD) {
      throw new Error("Missing SMTP environment variables");
    }

    const port = parseInt(process.env.SMTP_PORT, 10);
    const isSecure = port === 465;

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

    const mailOptions = {
      from: `LibraFlow <${process.env.SMTP_MAIL}>`,
      to: options.email,
      subject: options.subject,
      html: options.message,
    };

    // Send email with Promise wrapper
    const info = await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result || { messageId: "sent", success: true });
        }
      });
    });
    
    return info;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    throw new Error("Email could not be sent: " + error.message);
  }
};

export default sendEmail;