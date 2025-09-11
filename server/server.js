// server/server.js
import { app } from "./app.js";
import { v2 as cloudinary } from "cloudinary";
import envConfig from "./config/environment.js";

// Environment configuration is automatically loaded by envConfig

// ===== CLOUDINARY CONFIG =====
try {
  const cloudinaryConfig = envConfig.getCloudinaryConfig();
  
  if (cloudinaryConfig.cloud_name && cloudinaryConfig.api_key && cloudinaryConfig.api_secret) {
    cloudinary.config(cloudinaryConfig);
    console.log("✅ Cloudinary configured successfully");
    console.log(`   • Cloud Name: ${cloudinaryConfig.cloud_name}`);
    console.log(`   • Folder: ${cloudinaryConfig.folder}`);
  } else {
    console.warn(
      "⚠️ Cloudinary not configured. Images upload functionality may not work."
    );
  }
} catch (error) {
  console.error("❌ Cloudinary configuration error:", error.message);
}

// ===== GLOBAL UNHANDLED REJECTION HANDLER =====
process.on("unhandledRejection", (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  console.error(err.stack);
  // Gracefully shut down the server
  process.exit(1);
});

// ===== START SERVER WITH ERROR HANDLING =====
const serverConfig = envConfig.getServerConfig();
const PORT = serverConfig.port;

// Store server instance for graceful shutdown
let server;

try {
  server = app.listen(PORT, serverConfig.host, () => {
    console.log(`🚀 Server running on ${serverConfig.host}:${PORT}`);
    console.log(`🌐 Frontend URL: ${serverConfig.frontendUrl}`);
    console.log(`🔧 Environment: ${envConfig.get('NODE_ENV', 'development')}`);
    console.log(`🔒 Security: ${envConfig.isProduction() ? 'Production mode' : 'Development mode'}`);
  });

  // Handle server errors
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use.`);
      console.log('💡 Suggestion: Try one of the following:');
      console.log('   1. Close the application using this port');
      console.log('   2. Change the PORT in your .env file');
      console.log('   3. Wait a moment and restart the server');
      process.exit(1);
    } else {
      console.error(`❌ Server error: ${err.message}`);
      process.exit(1);
    }
  });
} catch (error) {
  console.error(`❌ Failed to start server: ${error.message}`);
  process.exit(1);
}

// ===== GRACEFUL SHUTDOWN HANDLER =====
const gracefulShutdown = () => {
  console.log('🛡️ Received shutdown signal, shutting down gracefully...');
  
  if (server) {
    server.close(() => {
      console.log('✅ Server closed successfully.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('💥 Force shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

// Listen for shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);