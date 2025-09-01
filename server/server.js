// server/server.js
import { config } from "dotenv";
config({ path: "./config/config.env" });

import { app } from "./app.js";
import { v2 as cloudinary } from "cloudinary";

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
    "⚠️ Cloudinary not configured. Image upload functionality may not work."
  );
}

// ===== GLOBAL UNCAUGHT EXCEPTION HANDLER =====
process.on("uncaughtException", (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
  console.error(err.stack);
  process.exit(1); // Crash immediately (serious error)
});

// ===== START SERVER =====
const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "Not set"}`);
});

// ===== GLOBAL UNHANDLED REJECTION HANDLER =====
process.on("unhandledRejection", (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  console.error(err.stack);
  // Gracefully close server before exiting
  server.close(() => {
    process.exit(1);
  });
});

// ===== HANDLE SIGTERM / GRACEFUL SHUTDOWN =====
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("💤 Process terminated");
  });
});

export default server;
