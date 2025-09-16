// server/scripts/createTestUsers.js
// Script to create test users for development and testing purposes

import bcrypt from "bcrypt";
import { User } from "../models/userModels.js";
import { connectDB } from "../database/db.js";
import { config } from "dotenv";

// Load environment variables
config({ path: "./config/config.env" });

// Test user data
const testUsers = [
  {
    name: "Test User",
    email: "testuser@example.com",
    password: "Test@1234",
    role: "User",
    accountVerified: true
  },
  {
    name: "Test Admin",
    email: "testadmin@example.com",
    password: "Admin@1234",
    role: "Admin",
    accountVerified: true
  }
];

const createTestUsers = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log("Creating test users...");
    
    // Create each test user
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists. Skipping...`);
        continue;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        accountVerified: userData.accountVerified
      });
      
      console.log(`✅ Created ${userData.role}: ${userData.email} with password: ${userData.password}`);
    }
    
    console.log("Test users created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating test users:", error);
    process.exit(1);
  }
};

// Run the script
createTestUsers();