import { io } from "socket.io-client";
import { API_URL, DEMO } from "../config";
import demoSocket from "../demo/demoSocket";

const socket = DEMO
  ? demoSocket
  : io(API_URL, {
      transports: ["polling", "websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

if (!DEMO) {
  // For debugging
  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.log("Socket connect error:", error);
  });
}

export default socket;
