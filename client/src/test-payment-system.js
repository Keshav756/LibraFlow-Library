// Simple test file to verify payment system connectivity
import axios from "axios";

// Configure axios with the correct base URL
axios.defaults.baseURL = "https://libraflow-libraray-management-system.onrender.com/api/v1";
axios.defaults.withCredentials = true;

const testPaymentAPI = async () => {
  try {
    console.log("Testing payment API connectivity...");
    
    // Test the root endpoint
    const rootResponse = await axios.get("/");
    console.log("Root API Response:", rootResponse.data);
    
    // Test the payment endpoint (this should work without authentication for a basic test)
    const paymentResponse = await axios.get("/payment/all-payments");
    console.log("Payment API Response Status:", paymentResponse.status);
    console.log("Payment API is working correctly!");
    
    return { success: true, data: paymentResponse.data };
  } catch (error) {
    console.error("API Error:", error.message);
    if (error.response) {
      console.error("Response Status:", error.response.status);
      console.error("Response Data:", error.response.data);
    }
    
    return { success: false, error: error.message };
  }
};

// Run the test
testPaymentAPI();

export default testPaymentAPI;