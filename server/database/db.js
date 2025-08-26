import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MongoDB URI is not defined in .env");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "MERN_STACK_LIBRARY_MANAGEMENT_SYSTEM",
      // Modern Mongoose no longer requires useNewUrlParser or useUnifiedTopology
    });

    console.log("✅ Connected to Database Successfully");
  } catch (err) {
    console.error("❌ Error connecting to database:", err.message);
    console.log("💡 Make sure MongoDB is running and MONGO_URI is correct in .env");
    process.exit(1);
  }

  // Optional: Handle disconnection events
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected!");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err);
  });
};