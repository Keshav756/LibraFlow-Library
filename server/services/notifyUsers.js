// server/utils/overdueNotifier.js

import cron from "node-cron";
import { Borrow } from "../models/borrowModels.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateOverdueReminderEmailTemplate } from "../utils/emailTemplates.js";

/**
 * Notify users about overdue books.
 * Runs every day at 9 AM server time.
 */
export const notifyUsers = () => {
  cron.schedule("0 9 * * *", async () => {
    try {
      const now = new Date();

      // Fetch overdue borrows that haven't been notified yet
      const overdueBorrows = await Borrow.find({
        dueDate: { $lt: now },
        returnDate: null,
        notified: false, // Works if you already have 'notified' in the schema
      }).populate("user book");

      if (!overdueBorrows.length) {
        console.log("✅ No overdue books to notify today.");
        return;
      }

      for (const borrow of overdueBorrows) {
        const { user, book } = borrow;

        if (!user || !user.email || !book) {
          console.warn("⚠️ Missing user or book info, skipping borrow:", borrow._id);
          continue;
        }

        // Calculate dynamic late fee
        const lateFee = calculateLateFee(borrow.dueDate);

        // Generate HTML email content
        const emailContent = generateOverdueReminderEmailTemplate(
          book.title,
          book.author,
          borrow.dueDate.toISOString(), // ISO format for consistency
          user.name,
          lateFee
        );

        try {
          await sendEmail({
            email: user.email,
            subject: "⚠️ Overdue Book Reminder - Action Required",
            message: emailContent,
          });

          // Mark borrow as notified
          borrow.notified = true;
          await borrow.save();

          console.log(`✅ Notification sent to ${user.email} for "${book.title}"`);
        } catch (emailError) {
          console.error(`❌ Failed to send overdue email to ${user.email}:`, emailError.message);
        }
      }
    } catch (error) {
      console.error("❌ Error while notifying users:", error);
    }
  });
};

/**
 * Calculate late fee based on overdue days
 * @param {Date} dueDate
 * @returns {number} late fee in ₹
 */
function calculateLateFee(dueDate) {
  const today = new Date();
  const diffTime = today - dueDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const feePerDay = 5; // ₹5 per day, can adjust
  return diffDays > 0 ? diffDays * feePerDay : 0;
}
