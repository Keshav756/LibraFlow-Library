import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "MERN_STACK_LIBRARY_MANAGEMENT_SYSTEM",
        });
        console.log("✅ Connected to Database Successfully");
    } catch (err) {
        console.error("❌ Error connecting to database:", err.message);
        console.log("💡 Make sure MongoDB is running on your system");
        process.exit(1);
    }
};
