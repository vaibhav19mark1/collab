import { createServer } from "http";
import { WebSocketServer } from "ws";
const YJS_PORT = process.env.YJS_PORT || 3002;

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", () => {
  console.log(`[YJS] Client connected`);
});

server.listen(YJS_PORT, () => {
  console.log(`Yjs WebSocket server running on port ${YJS_PORT}`);
});

export { wss };
