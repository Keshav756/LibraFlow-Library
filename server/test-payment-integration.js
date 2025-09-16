// Simple test file to verify payment system integration
// This file can be run with: node test-payment-integration.js

const https = require('https');

// Test the deployed server
const testPaymentEndpoint = () => {
  console.log("Testing payment endpoint connectivity...");
  
  const options = {
    hostname: 'libraflow-libraray-management-system.onrender.com',
    port: 443,
    path: '/api/v1/payment/all-payments',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    
    res.on('data', (chunk) => {
      console.log(`Body: ${chunk}`);
    });
    
    res.on('end', () => {
      console.log('Request completed');
    });
  });
  
  req.on('error', (error) => {
    console.error('Error:', error.message);
  });
  
  req.end();
};

// Run the test
testPaymentEndpoint();

console.log("Payment integration test initiated...");