const WebSocket = require("ws");
const fs = require("fs");

// WebSocket Server Setup
const wss = new WebSocket.Server({ port: 9000 });

console.log("✅ WebSocket server running on ws://localhost:9000");

// Handle incoming connections
wss.on("connection", (ws) => {
  console.log("🔗 New client connected");

  ws.on("message", (message) => {
    console.log("📩 Raw Received Data:", message.toString()); // Log everything received
    try {
      const data = JSON.parse(message.toString());
      console.log("📩 Parsed Event:", data);
      saveAnalyticsData(message);
    } catch (error) {
      console.error("❌ Error parsing received data:", error);
    }
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });

  ws.on("error", (err) => {
    console.error("⚠️ WebSocket error:", err);
  });
});

// Function to save analytics data
const saveAnalyticsData = (data) => {
  const logFile = "analytics-log.json";

  try {
    let logs = [];
    if (fs.existsSync(logFile)) {
      const existingData = fs.readFileSync(logFile, "utf8");
      logs = existingData ? JSON.parse(existingData) : [];
    }

    logs.push(JSON.parse(data));

    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    console.log("✅ Data saved to analytics-log.json");
  } catch (err) {
    console.error("❌ Error saving data:", err);
  }
};
