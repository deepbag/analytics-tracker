(function () {
  "use strict";

  const CONFIG = {
    serverUrl: "ws://localhost:5000", // Change this to your WebSocket server URL
    batchInterval: 5000, // Send every 5 seconds
  };

  let socket;
  let queue = [];
  let websiteId = null;
  let locationData = {};

  // Fetch user's location
  const fetchLocation = async () => {
    try {
      const response = await fetch("http://ip-api.com/json");
      const data = await response.json();
      locationData = {
        country: data.country,
        region: data.regionName,
        city: data.city,
        lat: data.lat,
        lon: data.lon,
        timezone: data.timezone,
        isp: data.isp,
      };
      console.log("[Analytics] Location fetched:", locationData);
    } catch (err) {
      console.warn("[Analytics] Failed to fetch location:", err);
    }
  };

  // Initialize WebSocket connection
  const initSocket = () => {
    if (!websiteId) {
      console.warn("[Analytics] Website ID is required. Tracking is disabled.");
      return;
    }

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
    if (!websiteId) {
      console.warn(
        "[Analytics] Website ID is required. Event tracking is disabled."
      );
      return;
    }

    const payload = {
      domain: window.location.hostname,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || null,
      eventType: eventName,
      properties: { ...props, ...locationData }, // Merge location data
      websiteId: websiteId, // Attach website ID if available
    };

    queue.push(payload);
    console.log("📩 Queued Event:", JSON.stringify(payload));

    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log("🚀 Sending event immediately...");
      sendQueue();
    }
  };

  // Send queued events
  const sendQueue = () => {
    if (
      !websiteId ||
      queue.length === 0 ||
      !socket ||
      socket.readyState !== WebSocket.OPEN
    )
      return;
    try {
      socket.send(JSON.stringify(queue));
      console.log("[Analytics] Sent:", queue.length, "events");
      queue = [];
    } catch (err) {
      console.error("[Analytics] Failed to send events:", err);
    }
  };

  setInterval(sendQueue, CONFIG.batchInterval);

  // Function to set website ID and track session
  const trackWebsiteSession = async (id) => {
    if (!id) {
      console.warn("[Analytics] Invalid website ID. Tracking is disabled.");
      return;
    }

    websiteId = id;
    await fetchLocation();
    initSocket();
    trackEvent("session_start", { websiteId: id });

    return new Promise((resolve) => {
      const checkSocket = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          clearInterval(checkSocket);
          resolve();
        }
      }, 100);
    });
  };

  // Expose global functions
  window.track = (eventName, properties) => trackEvent(eventName, properties);
  window.trackWebsiteSession = trackWebsiteSession;
})();
