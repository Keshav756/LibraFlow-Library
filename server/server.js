import { app } from "./app.js";
import{v2 as cloudinary} from "cloudinary";

// Only configure cloudinary if credentials are provided
if (process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name') {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log("✅ Cloudinary configured");
} else {
    console.log("⚠️  Cloudinary not configured (using placeholder values)");
}

app.listen(process.env.PORT, () => {
    console.log(`🚀 Server is running on port ${process.env.PORT}`);
    console.log(`📧 Email: ${process.env.SMTP_MAIL}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
});
