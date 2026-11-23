// Tiny in-browser stand-in for the Socket.IO client, used in demo mode.
const listeners = {};

const demoSocket = {
  id: "demo-socket",
  connected: true,
  on(event, fn) {
    (listeners[event] = listeners[event] || new Set()).add(fn);
    return demoSocket;
  },
  off(event, fn) {
    if (listeners[event]) listeners[event].delete(fn);
    return demoSocket;
  },
  emit() {
    return demoSocket; // nothing to send anywhere
  },
  connect() {
    return demoSocket;
  },
  disconnect() {
    return demoSocket;
  },
};

// Used by the mock backend to push "server" events to the UI.
export function dispatchDemoEvent(event, data) {
  (listeners[event] || []).forEach((fn) => {
    try {
      fn(data);
    } catch (e) {
      console.error("demo socket listener error", e);
    }
  });
}

export default demoSocket;
