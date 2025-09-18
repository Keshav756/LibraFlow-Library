// Root server.js - Redirect to actual server
// This file exists to fix Render deployment path issues

import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/config/config.env
config({ path: path.join(__dirname, "server", "config", "config.env") });

console.log("🔄 Starting LibraFlow server from root...");

// Import and start the actual server
import('./server/server.js')
    .then(() => {
        console.log('✅ Server started successfully from root redirect');
    })
    .catch((error) => {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    });