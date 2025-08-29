import cron from "node-cron";
import { User } from "../models/userModels.js";

export const removeUnverifiedAccounts = () => {
  // Schedule cron job every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes in ms

      const result = await User.deleteMany({
        accountVerified: false,
        createdAt: { $lt: thirtyMinutesAgo },
      });

      console.log(`✅ Unverified accounts removed successfully: ${result.deletedCount}`);
      console.log(`Checked for accounts created before: ${thirtyMinutesAgo.toISOString()}`);
    } catch (error) {
      console.error("❌ Error while removing unverified accounts:", error);
    }
  });
};