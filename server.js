const WebSocket = require("ws");
const fs = require("fs");

// WebSocket Server Setup
const wss = new WebSocket.Server({ port: 9000 });

console.log("✅ WebSocket server running on ws://localhost:9000");

// Handle incoming connections
wss.on("connection", (ws) => {
  console.log("🔗 New client connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log("📩 Parsed Event:", data);
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

