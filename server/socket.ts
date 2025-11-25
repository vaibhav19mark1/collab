import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { parse } from "cookie";
import jwt from "jsonwebtoken";

const PORT = process.env.SOCKET_IO_PORT || 3001;

const httpServer = createServer((req, res) => {
  // Handle HTTP POST requests for emitting events
  if (req.method === "POST" && req.url === "/emit") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { event, payload } = JSON.parse(body);
        console.log(`[HTTP] Received event ${event}`, payload);

        // Emit the event to the appropriate room
        if (event.startsWith("server:")) {
          const clientEvent = event.replace("server:", "");
          io.to(`room:${payload.roomId}`).emit(clientEvent, payload);
          console.log(
            `[HTTP] Broadcasted ${clientEvent} to room:${payload.roomId}`
          );
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error("[HTTP] Error processing event:", error);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Invalid request" }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000",
    credentials: true,
  },
});

// auth middleware
io.use(async (socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) {
      return next(new Error("Authentication error: No cookies sent"));
    }

    const parsedCookies = parse(cookies);
    const sessionToken =
      parsedCookies["authjs.session-token"] ||
      parsedCookies["__Secure-authjs.session-token"];

    if (!sessionToken) {
      return next(new Error("Authentication error: No session token"));
    }

    socket.data.sessionToken = sessionToken;

    // const decodedToken = jwt.verify(sessionToken, process.env.AUTH_SECRET!);
    // console.log({ decodedToken });
    // socket.data.userId = decodedToken.sub;

    next();
  } catch (error) {
    console.error(error);
  }
});

io.on("connection", (socket) => {
  console.log(`Client socket connected: ${socket.id}`);

  socket.on("room:join", (roomId) => {
    socket.join(`room:${roomId}`);
    console.log(`Client ${socket.id} joined room ${roomId}`);
  });

  socket.on("room:leave", (roomId) => {
    socket.leave(`room:${roomId}`);
    console.log(`Client ${socket.id} left room ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });

  // server-side event handlers
  socket.on("server:participant:joined", (payload: any) => {
    console.log(
      `[SERVER] Received server:participant:joined, broadcasting to room:${payload.roomId}`,
      payload
    );
    io.to(`room:${payload.roomId}`).emit("participant:joined", payload);
  });

  socket.on("server:participant:left", (payload: any) => {
    io.to(`room:${payload.roomId}`).emit("participant:left", payload);
  });

  socket.on("server:participant:kicked", (payload: any) => {
    io.to(`room:${payload.roomId}`).emit("participant:kicked", payload);
  });

  socket.on("server:participant:banned", (payload: any) => {
    io.to(`room:${payload.roomId}`).emit("participant:banned", payload);
  });

  socket.on("server:participant:unbanned", (payload: any) => {
    io.to(`room:${payload.roomId}`).emit("participant:unbanned", payload);
  });

  socket.on("server:participant:role_changed", (payload: any) => {
    io.to(`room:${payload.roomId}`).emit("participant:role_changed", payload);
  });

  socket.on("server:room:settings_updated", (payload: any) => {
    io.to(`room:${payload.roomId}`).emit("room:settings_updated", payload);
  });

  socket.on("server:room:deleted", (payload: any) => {
    io.to(`room:${payload.roomId}`).emit("room:deleted", payload);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});

export { io };
