const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const PORT = 5000;
const app = express();

// Create an HTTP server and integrate WebSocket with it
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files (including tracker.js)
app.use(express.static(path.join(__dirname)));

// Serve a simple home page
app.get("/", (req, res) => {
  res.send("✅ Server is running. WebSocket and tracker.js are available.");
});

// Store connections: { socketId: { websiteId, startTime, endTime, sessionTime, ws } }
const connections = new Map();

// Handle WebSocket connections
wss.on("connection", (ws) => {
  const socketId = generateSocketId();
  const startTime = Date.now(); // Store as timestamp (ms)

  console.log("🔗 New client connected:", socketId);

  // Default connection details
  connections.set(socketId, {
    websiteId: null,
    startTime,
    endTime: null,
    sessionTime: null,
    ws,
  });

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log("📩 Parsed Event:", data);

      // If the message contains websiteId, store it
      if (data?.[0]?.properties.websiteId) {
        const conn = connections.get(socketId);
        connections.set(socketId, {
          ...conn,
          websiteId: data?.[0]?.properties.websiteId,
        });
      }
    } catch (error) {
      console.error("❌ Error parsing received data:", error);
    }
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected:", socketId);
    const conn = connections.get(socketId);
    if (conn) {
      const endTime = Date.now();
      const sessionTime = (endTime - conn.startTime) / 1000;
      connections.set(socketId, { ...conn, endTime, sessionTime });

      console.log(`⏳ Session Time for ${socketId}: ${sessionTime} seconds`);
    }
  });

  ws.on("error", (err) => {
    console.error("⚠️ WebSocket error:", err);
  });
});

// Function to generate a unique socketId
function generateSocketId() {
  return `socket_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

// Start the combined Express + WebSocket server
server.listen(PORT, () => {
  console.log(
    `✅ Server running on http://localhost:${PORT} (WebSocket & Express)`
  );
});
