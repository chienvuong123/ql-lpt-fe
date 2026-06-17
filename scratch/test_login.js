const axios = require('axios');

async function test() {
  const url = "http://113.160.131.3:7782/api/Login";
  const data = {
    Username: "chienvx",
    Password: "@chienvx"
  };
  
  try {
    console.log("Sending request to:", url);
    console.log("With payload:", data);
    const response = await axios.post(url, data);
    console.log("Status:", response.status);
    console.log("Data:", response.data);
  } catch (error) {
    console.error("Error calling login api:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

test();
