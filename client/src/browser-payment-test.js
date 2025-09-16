// Browser-based test for payment system
// This file can be imported in a browser environment to test payment functionality

const testRazorpayIntegration = () => {
  console.log("Testing Razorpay Integration...");
  
  // Check if Razorpay script can be loaded
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.async = true;
  
  script.onload = () => {
    console.log("✅ Razorpay script loaded successfully");
    
    // Check if Razorpay object is available
    if (typeof window.Razorpay !== "undefined") {
      console.log("✅ Razorpay object is available");
      
      // Test creating a mock payment options object
      const options = {
        key: "rzp_test_JTA2gns76PnMtx", // Test key
        amount: 5000, // 50 INR in paise
        currency: "INR",
        name: "LibraFlow Library",
        description: "Test fine payment",
        order_id: "order_test_123",
        handler: function (response) {
          console.log("Payment response:", response);
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
        },
        theme: {
          color: "#333333"
        }
      };
      
      console.log("✅ Payment options object created successfully");
      console.log("Payment options:", options);
      
      // Note: We won't actually open the payment modal in this test
      console.log("✅ Razorpay integration test completed successfully");
    } else {
      console.error("❌ Razorpay object is not available");
    }
  };
  
  script.onerror = () => {
    console.error("❌ Failed to load Razorpay script");
  };
  
  document.body.appendChild(script);
};

// Run the test
if (typeof window !== "undefined") {
  // This will only run in a browser environment
  testRazorpayIntegration();
}

export default testRazorpayIntegration;