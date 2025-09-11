import mongoose from "mongoose";
import envConfig from "../config/environment.js";

export const connectDB = async () => {
  try {
    const dbConfig = envConfig.getDatabaseConfig();
    
    if (!dbConfig.uri) {
      throw new Error("MongoDB URI is not defined in environment configuration");
    }

    // Enhanced connection with security and monitoring
    await mongoose.connect(dbConfig.uri, {
      dbName: dbConfig.dbName,
      maxPoolSize: dbConfig.options.maxPoolSize,
      serverSelectionTimeoutMS: dbConfig.options.serverSelectionTimeoutMS,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
    });

    console.log("✅ Connected to Database Successfully");
    console.log(`   • Database: ${dbConfig.dbName}`);
    console.log(`   • Environment: ${envConfig.get('NODE_ENV', 'development')}`);
    console.log(`   • Max Pool Size: ${dbConfig.options.maxPoolSize}`);
    
  } catch (err) {
    console.error("❌ Error connecting to database:", err.message);
    
    // Enhanced error logging for security
    if (err.message.includes('authentication failed')) {
      console.error("🔐 Database authentication failed - check credentials");
    } else if (err.message.includes('ENOTFOUND')) {
      console.error("🌐 Database host not found - check connection string");
    } else if (err.message.includes('timeout')) {
      console.error("⏱️ Database connection timeout - check network/firewall");
    }
    
    console.log("💡 Make sure MongoDB is running and credentials are correct");
    process.exit(1);
  }

  // Enhanced connection event handling
  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB connection established");
  });
  
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected! Attempting to reconnect...");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
  
  mongoose.connection.on("reconnected", () => {
    console.log("✅ MongoDB reconnected successfully");
  });
  
  // Graceful shutdown handling
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('🛡️ MongoDB connection closed through app termination');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during MongoDB disconnect:', err.message);
      process.exit(1);
    }
  });
};