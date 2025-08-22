import cron from "node-cron";
import { User } from "../models/userModels.js";

export const removeUnverifiedAccounts = () => {
  cron.schedule("*/10 * * * *", async () => {
    const thirtyminutesAgo = new Date(Date.now() - 30 * 60 * 60 * 1000);
    await User.deleteMany({
        accountVerified: false, 
        createdAt: { $lt: thirtyminutesAgo },
    });
    console.log("Unverified accounts removed successfully");
    console.log(thirtyminutesAgo);

  });
}