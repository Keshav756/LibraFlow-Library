// server/utils/fineCalculator.js

/**
 * Calculates fine for overdue books.
 *
 * @param {Date|string} dueDate - Due date of the borrowed book
 * @param {Date|string} [returnDate=new Date()] - Actual return date (defaults to today)
 * @param {number} [finePerDay=25] - Fine per day in currency
 * @param {number} [gracePeriodDays=1] - Number of grace period days
 * @param {string} [currencySymbol='₹'] - Currency symbol for fine
 * @returns {{ fine: number, message: string }}
 *
 * Example usage:
 *   const result = fineCalculator('2025-08-01', '2025-08-05');
 *   console.log(result.fine);    // Fine amount
 *   console.log(result.message); // Explanation message
 */
const fineCalculator = (
  dueDate,
  returnDate = new Date(),
  finePerDay = 25,
  gracePeriodDays = 1,
  currencySymbol = "₹"
) => {
  if (!dueDate) {
    return {
      fine: 0,
      message: "Due date not provided. Unable to calculate fine.",
    };
  }

  const due = new Date(dueDate);
  const returned = new Date(returnDate);

  // Normalize time to ignore hours/minutes/seconds
  due.setHours(0, 0, 0, 0);
  returned.setHours(0, 0, 0, 0);

  const diffTime = returned.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Book returned on or before due date
  if (diffDays <= 0) {
    return {
      fine: 0,
      message: `🌟 Excellent! You've returned the book on or before the due date. No fine is charged. ✅`,
    };
  }

  // Within grace period
  if (diffDays <= gracePeriodDays) {
    return {
      fine: 0,
      message: `🕊️ Book returned within the ${gracePeriodDays}-day grace period. No fine applied. 🎉`,
    };
  }

  // Overdue beyond grace period
  const overdueDays = diffDays - gracePeriodDays;
  const fineAmount = finePerDay * overdueDays;

  return {
    fine: fineAmount,
    message: `⚠️ Returned ${overdueDays} day(s) late. A fine of ${currencySymbol}${fineAmount} has been applied.`,
  };
};

export default fineCalculator;
