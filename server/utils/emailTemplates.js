export function generateVerificationOtpEmailTemplate(otpCode) {
  return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; background-color: #f9fafb; padding: 32px; border-radius: 16px; border: 1px solid #e5e7eb;">
        
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 28px; font-weight: 700; color: #111827; margin-bottom: 8px;">🔐 Email Verification</h1>
          <p style="font-size: 16px; color: #6b7280;">Secure your account by verifying your email address</p>
        </div>
  
        <div style="margin-bottom: 24px;">
          <p style="font-size: 16px; color: #374151;">Hi there,</p>
          <p style="font-size: 16px; color: #374151; margin-top: 8px;">
            To continue, please use the one-time password (OTP) below:
          </p>
        </div>
  
        <div style="text-align: center; margin: 24px 0;">
          <span style="
            display: inline-block;
            font-size: 32px;
            font-weight: 700;
            color: #1f2937;
            background-color: #e0f2fe;
            padding: 12px 32px;
            border-radius: 12px;
            letter-spacing: 4px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
          ">
            ${otpCode}
          </span>
        </div>
  
        <p style="font-size: 14px; color: #6b7280; text-align: center;">
          This code is valid for <strong>5 minutes</strong>. Do not share it with anyone.
        </p>
  
        <div style="margin-top: 32px; text-align: center; font-size: 14px; color: #6b7280;">
          <p>If you didn’t request this, you can safely ignore this email.</p>
        </div>
  
        <hr style="margin: 32px 0; border-color: #e5e7eb;" />
  
        <footer style="text-align: center; color: #9ca3af; font-size: 14px;">
          <p>Thank you,<br><strong>LibraFlow Team</strong></p>
          <p style="margin-top: 8px; font-size: 12px;">This is an automated email – please do not reply.</p>
        </footer>
      </div>
    `;
}

export function generatePasswordResetEmailTemplate(resetPasswordUrl) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Password Reset</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f9fafb;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        padding: 32px;
        border-radius: 16px;
        border: 1px solid #e5e7eb;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
      }
      h1 {
        font-size: 26px;
        font-weight: 700;
        color: #111827;
        margin: 8px 0;
      }
      p {
        font-size: 15px;
        color: #374151;
        margin: 8px 0;
      }
      .btn {
        display: inline-block;
        padding: 12px 32px;
        background-color: #3b82f6;
        color: white;
        font-size: 15px;
        font-weight: 600;
        text-decoration: none;
        border-radius: 12px;
        letter-spacing: 1px;
        box-shadow: 0 4px 14px rgba(59, 130, 246, 0.2);
        transition: opacity 0.3s ease;
      }
      .btn:hover {
        opacity: 0.9;
      }
      .logo {
        width: 60px;
        margin-bottom: 12px;
      }
      .hero-img {
        width: 140px;
        border-radius: 12px;
        margin: 20px auto;
      }
      .footer {
        font-size: 13px;
        color: #9ca3af;
        text-align: center;
        margin-top: 32px;
      }
      .small-text {
        font-size: 13px;
        color: #6b7280;
        text-align: center;
      }
      @media (prefers-color-scheme: dark) {
        body {
          background-color: #1f2937;
        }
        .container {
          background-color: #111827;
          color: #e5e7eb;
          border-color: #374151;
        }
        p, h1 {
          color: #e5e7eb;
        }
        .btn {
          background-color: #3b82f6;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div style="text-align: center;">
        <img src="https://cdn-icons-png.flaticon.com/512/3176/3176364.png" alt="LibraFlow Icon" class="logo" />
        <h1>🔁 Reset Your Password</h1>
        <p style="color: #6b7280;">We received a request to reset your password.</p>
      </div>

      <div style="text-align: center;">
        <img src="https://cdn-icons-png.flaticon.com/512/7339/7339472.png" alt="Reset Illustration" class="hero-img" />
      </div>

      <div style="text-align: center;">
        <p>Hi there,</p>
        <p>Click the button below to securely reset your password. This link is valid for <strong>5 minutes</strong>.</p>
        <a href="${resetPasswordUrl}" target="_blank" class="btn">Reset Password</a>
      </div>

      <div class="small-text" style="margin-top: 24px;">
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #1e3a8a; word-break: break-word;">${resetPasswordUrl}</p>
      </div>

      <div class="small-text" style="margin-top: 24px;">
        <p>If you didn’t request this, just ignore this email.</p>
        <p>We care about your account security. 🔐</p>
      </div>

      <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />

      <div class="footer">
        <p>Thanks,<br><strong>LibraFlow Support Team</strong></p>
        <p style="margin-top: 8px; font-size: 12px;">This is an automated email — please do not reply.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}