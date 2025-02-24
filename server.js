const WebSocket = require("ws");

// WebSocket Server Setup
const wss = new WebSocket.Server({ port: 9000 });

console.log("✅ WebSocket server running on ws://localhost:9000");

// Store connections: { socketId: { websiteId, startTime, endTime, sessionTime, ws } }
const connections = new Map();

// Handle incoming connections
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
      const websiteId = conn.websiteId;
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

// setInterval(() => {
//   console.log("📊 Active Connections:");
//   for (const [socketId, data] of connections) {
//     console.log(`🟢 ${socketId}:`, {
//       websiteId: data.websiteId,
//       startTime: new Date(data.startTime).toISOString(),
//       endTime: data.endTime ? new Date(data.endTime).toISOString() : null,
//       sessionTime: data.sessionTime,
//     });
//   }
// }, 5000);
