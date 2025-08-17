const axios = require("axios");

async function testAPIConnection() {
  console.log("🔍 Testing API Connection from Frontend Perspective\n");

  const API_BASE_URL = "http://localhost:3001/api";

  try {
    // Test 1: Check if API is reachable
    console.log("📍 Test 1: Checking API reachability...");
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log("✅ API is reachable");
    console.log("Health response:", healthResponse.data);

    // Test 2: Test login API directly
    console.log("\n📍 Test 2: Testing login API...");
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: "superadmin@example.com",
      password: "password123",
    });

    console.log("✅ Login API call successful");
    console.log("Response status:", loginResponse.status);
    console.log("Response data structure:", {
      success: loginResponse.data.success,
      message: loginResponse.data.message,
      hasData: !!loginResponse.data.data,
      hasUser: !!loginResponse.data.data?.user,
      hasToken: !!loginResponse.data.data?.accessToken,
    });

    // Test 3: Test with invalid credentials
    console.log("\n📍 Test 3: Testing with invalid credentials...");
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        email: "invalid@example.com",
        password: "wrongpassword",
      });
      console.log("❌ Expected failure but got success");
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log("✅ Correctly failed with 401 Unauthorized");
        console.log("Error message:", error.response.data.error);
      } else {
        console.log("❌ Unexpected error:", error.message);
      }
    }

    // Test 4: Test CORS headers
    console.log("\n📍 Test 4: Checking CORS headers...");
    const corsResponse = await axios.options(`${API_BASE_URL}/auth/login`);
    console.log("CORS headers:", {
      "Access-Control-Allow-Origin":
        corsResponse.headers["access-control-allow-origin"],
      "Access-Control-Allow-Methods":
        corsResponse.headers["access-control-allow-methods"],
      "Access-Control-Allow-Headers":
        corsResponse.headers["access-control-allow-headers"],
    });

    console.log("\n🎉 API connection test completed successfully!");
    console.log("The backend API is working correctly.");
    console.log("If the frontend login is still failing, the issue might be:");
    console.log("1. Frontend form validation");
    console.log("2. Frontend state management");
    console.log("3. Frontend routing after login");
    console.log("4. Browser console errors");
  } catch (error) {
    console.error("❌ API connection test failed:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

// Run the test
testAPIConnection();
