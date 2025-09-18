// Simple test file to verify payment system connectivity
import axios from "axios";

// Configure axios with the correct base URL
axios.defaults.baseURL = "https://libraflow-library.onrender.com/api/v1";
axios.defaults.withCredentials = true;

const testPaymentAPI = async () => {
  try {
    console.log("Testing payment API connectivity...");
    
    // Test the all-payments endpoint (this should work without authentication)
    const response = await axios.get("/payment/all-payments");
    console.log("API Response:", response.data);
    console.log("Payment API is working correctly!");
    
    return response.data;
  } catch (error) {
    console.error("API Error:", error.message);
    if (error.response) {
      console.error("Response Status:", error.response.status);
      console.error("Response Data:", error.response.data);
    }
    
    return { error: error.message };
  }
};

// Run the test
testPaymentAPI();

export default testPaymentAPI;