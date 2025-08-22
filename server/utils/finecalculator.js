export const calculateFine = (dueDate, returnDate = new Date()) => {
  const finePerDay = 25;
  const gracePeriodDays = 1;
  const currencySymbol = "₹";

  const due = new Date(dueDate);
  const returned = new Date(returnDate);

  due.setHours(0, 0, 0, 0);
  returned.setHours(0, 0, 0, 0);

  const diffTime = returned.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      fine: 0,
      message: `🌟 Excellent! You've returned the book **before the due date**. No fine is charged. Keep up the punctuality! ✅`,
    };
  }

  if (diffDays <= gracePeriodDays) {
    return {
      fine: 0,
      message: `🕊️ Book returned within the **${gracePeriodDays}-day grace period**. You're all good – no fine applied! 🎉`,
    };
  }

  const overdueDays = diffDays - gracePeriodDays;
  const fineAmount = finePerDay * overdueDays;

  return {
    fine: fineAmount,
    message: `⚠️ Returned **${overdueDays} day(s)** late. A fine of ${currencySymbol}${fineAmount} has been applied. Please try to return on time next time. 📚`,
  };
};
