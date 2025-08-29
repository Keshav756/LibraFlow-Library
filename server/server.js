// server/server.js
import { app } from "./app.js";
import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";

// Load environment variables
config({ path: "./config/config.env" });

// ===== CLOUDINARY CONFIG =====
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("✅ Cloudinary configured successfully");
} else {
  console.warn(
    "⚠️ Cloudinary not configured. Images upload functionality may not work."
  );
}

// ===== GLOBAL UNHANDLED REJECTION HANDLER =====
process.on("unhandledRejection", (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  console.error(err.stack);
  // Gracefully shut down the server
  process.exit(1);
});

// ===== START SERVER =====
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "Not set"}`);
});
