// Simple test to debug the onboarding endpoint
const testPayload = {
  basket_id: "00000000-0000-0000-0000-000000000001",
  name: "Test User",
  tension: "Testing the onboarding flow",
  aspiration: "Make sure everything works",
  memory_paste: "Optional memory content",
  create_profile_document: true
};

console.log("Testing onboarding endpoint with payload:", JSON.stringify(testPayload, null, 2));

fetch('http://localhost:3000/api/onboarding/complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-token' // Will need real token
  },
  body: JSON.stringify(testPayload)
})
.then(async (res) => {
  console.log("Response status:", res.status);
  console.log("Response headers:", Object.fromEntries(res.headers.entries()));
  
  const text = await res.text();
  console.log("Response body:", text);
  
  if (res.headers.get('content-type')?.includes('application/json')) {
    try {
      const json = JSON.parse(text);
      console.log("Parsed JSON:", JSON.stringify(json, null, 2));
    } catch (e) {
      console.log("Failed to parse JSON:", e.message);
    }
  }
})
.catch(err => {
  console.error("Network error:", err);
});