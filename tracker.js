(function () {
  "use strict";

  const CONFIG = {
    serverUrl: "ws://localhost:9000", // Change this to your WebSocket server URL
    batchInterval: 5000, // Send every 5 seconds
  };

  let socket,
    queue = [];

  // Initialize WebSocket connection
  const initSocket = () => {
    socket = new WebSocket(CONFIG.serverUrl);

    socket.onopen = () => {
      console.log("[Analytics] Connected to server");
      sendQueue();
    };

    socket.onmessage = (event) => {
      console.log("[Analytics] Server Response:", event.data);
    };

    socket.onerror = (err) => {
      console.error("[Analytics] WebSocket error:", err);
    };

    socket.onclose = () => {
      console.warn("[Analytics] Connection closed, retrying...");
      setTimeout(initSocket, 3000); // Reconnect after 3 seconds
    };
  };

  // Track an event
  const trackEvent = (eventName, props = {}) => {
    const payload = {
      domain: window.location.hostname,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || null,
      eventType: eventName,
      properties: props,
    };
  
    queue.push(payload);
    console.log("📩 Queued Event:", JSON.stringify(payload));
  
    if (socket.readyState === WebSocket.OPEN) {
      console.log("🚀 Sending event immediately...");
      sendQueue();
    }
  };
  
  // Send queued events
  const sendQueue = () => {
    if (queue.length === 0 || socket.readyState !== WebSocket.OPEN) return;
    try {
      socket.send(JSON.stringify(queue));
      console.log("[Analytics] Sent:", queue.length, "events");
      queue = [];
    } catch (err) {
      console.error("[Analytics] Failed to send events:", err);
    }
  };

  setInterval(sendQueue, CONFIG.batchInterval);

  // Auto-track pageview and initialize
  initSocket();
  trackEvent("pageview");

  // Expose global track function
  window.track = (eventName, properties) => trackEvent(eventName, properties);
})();
