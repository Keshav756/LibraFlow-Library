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
  console.log("✅ Cloudinary configured");
} else {
  console.warn("⚠️ Cloudinary not configured. File uploads may not work.");
}

// ===== START SERVER =====
const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Allowed Frontend URL: ${process.env.FRONTEND_URL || "Not set"}`);
});
