<<<<<<< HEAD
import { app } from "./app.js";
import { v2 as cloudinary } from "cloudinary";
=======
import { app } from './app.js';
import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';
config({ path: './config/config.env' });
>>>>>>> 1730d72 (final commit)

// ===== CLOUDINARY CONFIG =====
if (process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
<<<<<<< HEAD
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("✅ Cloudinary configured");
} else {
  console.log("⚠️ Cloudinary not configured");
}
=======
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log("✅ Cloudinary configured");
} else console.log("⚠️ Cloudinary not configured");
>>>>>>> 1730d72 (final commit)

// ===== START SERVER =====
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
});
