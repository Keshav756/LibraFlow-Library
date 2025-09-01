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

function formatDate(date) {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
}

// ------------------------- Borrow Confirmation Email -------------------------
export function generateBorrowConfirmationEmailTemplate(
  bookTitle = "Untitled Book",
  bookAuthor = "Unknown Author",
  borrowDate,
  returnDate,
  userName = "Reader",
  bookCoverUrl = "https://cdn-icons-png.flaticon.com/512/60/60577.png" // default placeholder
) {
  const formattedBorrowDate = formatDate(borrowDate);
  const formattedReturnDate = formatDate(returnDate);

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Book Borrow Confirmation</title>
    <style>
      body {margin:0; padding:0; background-color:#f9fafb; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;}
      .container {max-width:600px; margin:40px auto; background-color:#ffffff; padding:32px; border-radius:16px; border:1px solid #e5e7eb; box-shadow:0 4px 14px rgba(0,0,0,0.05);}
      h1 {font-size:26px; font-weight:700; color:#111827; margin:8px 0;}
      p {font-size:15px; color:#374151; margin:8px 0;}
      .details-table {width:100%; border-collapse:collapse; margin-top:20px;}
      .details-table th, .details-table td {border:1px solid #e5e7eb; padding:12px; text-align:left;}
      .details-table th {background-color:#f3f4f6; font-weight:600; color:#4b5563;}
      .details-table td {background-color:#ffffff; color:#374151;}
      .book-cover {display:block; margin:16px auto; width:120px; height:auto; border-radius:8px;}
      .btn {display:inline-block; padding:12px 28px; background-color:#3b82f6; color:#ffffff; text-decoration:none; font-weight:600; border-radius:12px; margin-top:20px;}
      .btn:hover {background-color:#2563eb !important;}
      .footer, .small-text {font-size:13px; color:#6b7280; text-align:center; margin-top:24px;}
      @media (prefers-color-scheme: dark) {
        body {background-color:#1f2937;}
        .container {background-color:#111827; color:#e5e7eb; border-color:#374151;}
        p,h1 {color:#e5e7eb;}
        .details-table th {background-color:#374151; color:#e5e7eb;}
        .details-table td {background-color:#1f2937; color:#e5e7eb;}
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div style="text-align:center;">
        <h1>📚 Book Borrowed Successfully!</h1>
        <p style="color:#6b7280;">Hi ${userName},</p>
        <p>You have successfully borrowed the following book:</p>
        <img src="${bookCoverUrl}" alt="Book Cover for ${bookTitle}" class="book-cover" />
      </div>
      <table class="details-table">
        <thead><tr><th>Detail</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td><strong>Book Title</strong></td><td>${bookTitle}</td></tr>
          <tr><td><strong>Book Author</strong></td><td>${bookAuthor}</td></tr>
          <tr><td><strong>Borrow Date</strong></td><td>${formattedBorrowDate}</td></tr>
          <tr><td><strong>Return Date</strong></td><td>${formattedReturnDate}</td></tr>
        </tbody>
      </table>
      <div class="small-text">
        <p>Please ensure the book is returned by the due date to avoid any late fees.</p>
        <p>Need help? <a href="mailto:support@libraflow.com">Contact Support</a></p>
      </div>
      <div style="text-align:center;">
        <a href="https://libraflow.com/my-books" class="btn">📖 Manage My Books</a>
      </div>
      <hr style="margin:32px 0; border:none; border-top:1px solid #e5e7eb;" />
      <div class="footer">
        <p>Thanks,<br><strong>LibraFlow Team</strong></p>
        <p style="margin-top:8px; font-size:12px;">This is an automated email — please do not reply.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

// ------------------------- Overdue Reminder Email -------------------------
export function generateOverdueReminderEmailTemplate(
  bookTitle = "Untitled Book",
  bookAuthor = "Unknown Author",
  dueDate,
  userName = "Reader",
  lateFee = 0,
  myBooksUrl = "https://libraflow.com/my-books",
  bookCoverUrl = "https://cdn-icons-png.flaticon.com/512/60/60577.png" // default placeholder
) {
  const formattedDueDate = formatDate(dueDate);

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Overdue Book Reminder</title>
    <style>
      body {margin:0; padding:0; background-color:#f3f4f6; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;}
      .container {max-width:650px; margin:40px auto; background-color:#ffffff; border-radius:16px; border:1px solid #e5e7eb; box-shadow:0 4px 14px rgba(0,0,0,0.05); overflow:hidden;}
      .header {background:linear-gradient(135deg, #dc2626, #b91c1c); text-align:center; color:#ffffff; padding:20px;}
      .header h1 {margin:0; font-size:26px;}
      .header p {margin:5px 0 0; font-size:14px; opacity:0.85;}
      .content {padding:32px; color:#111827;}
      .content h2 {font-size:20px; margin-bottom:16px;}
      .book-card {background-color:#fef3f2; border:1px solid #fca5a5; padding:20px; border-radius:12px; margin:20px 0; text-align:center;}
      .book-card p {margin:6px 0; font-size:16px;}
      .book-card strong {color:#b91c1c;}
      .book-cover {width:120px; height:auto; border-radius:8px; margin:12px auto;}
      .cta-button {display:inline-block; background-color:#dc2626; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:bold; margin:20px 0; font-size:15px;}
      .cta-button:hover {background-color:#b91c1c !important;}
      .footer {background-color:#f9fafb; text-align:center; font-size:13px; color:#6b7280; padding:20px; border-top:1px solid #e5e7eb;}
      .footer a {color:#2563eb; text-decoration:none;}
      @media (prefers-color-scheme: dark) {
        body {background-color:#1f2937;}
        .container {background-color:#111827; border-color:#374151; color:#e5e7eb;}
        .content {color:#e5e7eb;}
        .book-card {background-color:#7f1d1d; border-color:#b91c1c;}
        .book-card strong {color:#f87171;}
        .footer {background-color:#111827; color:#9ca3af; border-top-color:#374151;}
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>⚠️ Overdue Book Reminder</h1>
        <p>LibraFlow Library Management System</p>
      </div>
      <div class="content">
        <h2>Hello ${userName},</h2>
        <p>We noticed that the following book is overdue. Please return it as soon as possible to avoid accumulating late fees.</p>
        <div class="book-card">
          <img src="${bookCoverUrl}" alt="Book Cover for ${bookTitle}" class="book-cover" />
          <p><strong>Title:</strong> ${bookTitle}</p>
          <p><strong>Author:</strong> ${bookAuthor}</p>
          <p><strong>Due Date:</strong> ${formattedDueDate}</p>
          <p><strong>Late Fee:</strong> ₹${lateFee}</p>
        </div>
        <p>Returning your book promptly helps other readers and keeps your account in good standing.</p>
        <div style="text-align:center;">
          <a href="${myBooksUrl}" class="cta-button">📖 View My Books</a>
        </div>
        <p>Thank you for your cooperation! 🙏</p>
      </div>
      <div class="footer">
        <p>Thanks,<br><strong>LibraFlow Team</strong></p>
        <p>Need help? <a href="mailto:support@libraflow.com">support@libraflow.com</a></p>
        <p style="margin-top:8px;">This is an automated email — please do not reply.</p>
        <p>Follow us: 
          <a href="https://twitter.com/libraflow">Twitter</a> | 
          <a href="https://facebook.com/libraflow">Facebook</a>
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
}