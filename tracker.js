(function () {
  "use strict";

  const loadPeerJS = () =>
    new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js";
      s.onload = () => resolve(window.Peer);
      document.head.appendChild(s);
    });

  const CONFIG = {
    serverPeerId: "analytics-server",
    peerHost: "localhost",
    peerPort: 9000,
    peerPath: "/peerjs",
    batchInterval: 5000,
  };

  let peer,
    conn,
    queue = [];

  const getUniqueId = () =>
    window.location.hostname.replace(/\./g, "_") || "unknown_" + Date.now();

  const initPeer = async () => {
    const Peer = await loadPeerJS();
    peer = new Peer(getUniqueId(), {
      host: CONFIG.peerHost,
      port: CONFIG.peerPort,
      path: CONFIG.peerPath,
      debug: 2, // Enable debugging
    });

    peer.on("open", () => {
      console.log("[Analytics] Peer ID:", peer.id);
      connectToServer();
    });

    peer.on("disconnected", () => {
      console.warn("[Analytics] Disconnected, reconnecting...");
      peer.reconnect();
    });

    peer.on("error", (err) => console.error("[Analytics] PeerJS error:", err));
  };

  const connectToServer = () => {
    conn = peer.connect(CONFIG.serverPeerId, { reliable: true });

    conn.on("open", () => {
      console.log("[Analytics] Connected to server");
      sendQueue();
    });

    conn.on("data", (data) => {
      console.log("[Analytics] Server Response:", data);
    });

    conn.on("error", (err) =>
      console.error("[Analytics] Connection error:", err)
    );

    conn.on("close", () => {
      console.warn("[Analytics] Connection closed, retrying...");
      setTimeout(connectToServer, 3000);
    });
  };

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
    console.log("[Analytics] Queued:", payload);
    if (conn && conn.open) sendQueue();
  };

  const sendQueue = () => {
    if (queue.length === 0 || !conn || !conn.open) return;
    try {
      conn.send(JSON.stringify(queue));
      console.log("[Analytics] Sent:", queue.length, "events");
      queue = [];
    } catch (err) {
      console.error("[Analytics] Failed to send events:", err);
    }
  };

  setInterval(sendQueue, CONFIG.batchInterval);

  initPeer().then(() => trackEvent("pageview"));

  window.track = (eventName, properties) => trackEvent(eventName, properties);
})();
