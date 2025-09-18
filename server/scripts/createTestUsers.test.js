// server/scripts/createTestUsers.test.js
// Test script to verify test user creation functionality

import { User } from "../models/userModels.js";
import { connectDB } from "../database/db.js";
import { config } from "dotenv";
import bcrypt from "bcryptjs";

// Load environment variables
config({ path: "./config/config.env" });

const testUserCreation = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log("Testing user creation...");
    
    // Test data
    const testUserData = {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test@1234",
      role: "User",
      accountVerified: true
    };
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: testUserData.email });
    if (existingUser) {
      console.log(`User ${testUserData.email} already exists. Deleting for test...`);
      await User.deleteOne({ email: testUserData.email });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(testUserData.password, 10);
    
    // Create user
    const user = await User.create({
      name: testUserData.name,
      email: testUserData.email,
      password: hashedPassword,
      role: testUserData.role,
      accountVerified: testUserData.accountVerified
    });
    
    console.log(`✅ Created test user: ${user.email}`);
    
    // Verify user was created correctly
    const foundUser = await User.findOne({ email: testUserData.email });
    if (foundUser) {
      console.log(`✅ User found in database with role: ${foundUser.role}`);
      
      // Verify password
      const isPasswordMatched = await bcrypt.compare(testUserData.password, foundUser.password);
      if (isPasswordMatched) {
        console.log("✅ Password verification successful");
      } else {
        console.log("❌ Password verification failed");
      }
      
      // Clean up - delete test user
      await User.deleteOne({ email: testUserData.email });
      console.log("✅ Test user cleaned up");
    } else {
      console.log("❌ User not found in database");
    }
    
    console.log("Test completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
};

// Run the test
testUserCreation();