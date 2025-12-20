import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { parse } from "cookie";
import crypto from "crypto";
import {
  ParticipantJoinedPayload,
  ParticipantLeftPayload,
  ParticipantKickedPayload,
  ParticipantBannedPayload,
  ParticipantUnbannedPayload,
  ParticipantRoleChangedPayload,
  RoomSettingsUpdatedPayload,
  RoomDeletedPayload,
} from "@/types/socket.types";

const PORT = process.env.PORT || process.env.SOCKET_IO_PORT || 3001;

// Helper for safe comparison
const safeCompare = (a: string, b: string) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

const httpServer = createServer((req, res) => {
  // Handle HTTP POST requests for emitting events
  if (req.method === "POST" && req.url === "/emit") {
    let body = "";

    // Check for authentication
    const adminKey = process.env.SOCKET_ADMIN_KEY;
    const requestKey = req.headers["x-admin-key"] as string;

    if (!adminKey || !requestKey || !safeCompare(adminKey, requestKey)) {
      console.warn("[HTTP] Unauthorized attempt to access /emit");
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: "Unauthorized" }));
      return;
    }

    req.on("data", (chunk) => {
      // Body Size Limit (1MB)
      if (body.length + chunk.length > 1e6) {
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Payload too large" }));
        req.destroy();
        return;
      }
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        if (!body) throw new Error("Empty body");
        const { event, payload } = JSON.parse(body);

        // Payload Validation
        if (!payload || !payload.roomId) {
          throw new Error("Invalid payload: missing roomId");
        }

        console.log(`[HTTP] Received event ${event}`, payload);

        // Emit the event to the appropriate room
        if (event && event.startsWith("server:")) {
          const clientEvent = event.replace("server:", "");
          io.to(`room:${payload.roomId}`).emit(clientEvent, payload);
          console.log(
            `[HTTP] Broadcasted ${clientEvent} to room:${payload.roomId}`
          );
        }

        if (event === "chat:message") {
          console.log(
            `[SERVER] Broadcasting chat:message to room:${payload.roomId}`
          );
          io.to(`room:${payload.roomId}`).emit(event, payload);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (error: unknown) {
        console.error(
          "[HTTP] Error processing event:",
          (error as Error).message
        );
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: (error as Error).message || "Invalid request",
          })
        );
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ["polling", "websocket"],
  allowEIO3: true,
  pingInterval: 5000,
  pingTimeout: 3000,
});

// auth middleware
io.use(async (socket, next) => {
  try {
    // Priority 1: Check auth params (for cross-domain deployments)
    const userId = socket.handshake.auth?.userId;

    if (userId) {
      socket.data.userId = userId;
      console.log(`[AUTH] User authenticated via auth params: ${userId}`);
      return next();
    }

    // Priority 2: Check cookies (for same-domain deployments)
    const cookies = socket.handshake.headers.cookie;
    if (cookies) {
      const parsedCookies = parse(cookies);
      const sessionToken =
        parsedCookies["authjs.session-token"] ||
        parsedCookies["__Secure-authjs.session-token"];

      if (sessionToken) {
        socket.data.sessionToken = sessionToken;
        console.log(`[AUTH] User authenticated via cookies`);
        return next();
      }
    }

    // No valid auth method found
    return next(new Error("Authentication error: No valid auth credentials"));
  } catch (error) {
    console.error("[AUTH] Error:", error);
    return next(new Error("Authentication error: Internal error"));
  }
});

io.on("connection", (socket) => {
  console.log(`Client socket connected: ${socket.id}`);

  socket.on("room:join", (roomId, userData) => {
    socket.join(`room:${roomId}`);
    if (userData) {
      socket.data.userId = userData.userId;
      socket.data.username = userData.username;
    }
    console.log(
      `Client ${socket.id} (${
        socket.data.username || "unknown"
      }) joined room ${roomId}`
    );
  });

  socket.on("room:leave", (roomId) => {
    socket.leave(`room:${roomId}`);
    console.log(`Client ${socket.id} left room ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });

  // server-side event handlers
  socket.on(
    "server:participant:joined",
    (payload: ParticipantJoinedPayload) => {
      console.log(
        `[SERVER] Received server:participant:joined, broadcasting to room:${payload.roomId}`,
        payload
      );
      io.to(`room:${payload.roomId}`).emit("participant:joined", payload);
    }
  );

  socket.on("server:participant:left", (payload: ParticipantLeftPayload) => {
    io.to(`room:${payload.roomId}`).emit("participant:left", payload);
  });

  socket.on(
    "server:participant:kicked",
    (payload: ParticipantKickedPayload) => {
      io.to(`room:${payload.roomId}`).emit("participant:kicked", payload);
    }
  );

  socket.on(
    "server:participant:banned",
    (payload: ParticipantBannedPayload) => {
      io.to(`room:${payload.roomId}`).emit("participant:banned", payload);
    }
  );

  socket.on(
    "server:participant:unbanned",
    (payload: ParticipantUnbannedPayload) => {
      io.to(`room:${payload.roomId}`).emit("participant:unbanned", payload);
    }
  );

  socket.on(
    "server:participant:role_changed",
    (payload: ParticipantRoleChangedPayload) => {
      io.to(`room:${payload.roomId}`).emit("participant:role_changed", payload);
    }
  );

  socket.on(
    "server:room:settings_updated",
    (payload: RoomSettingsUpdatedPayload) => {
      io.to(`room:${payload.roomId}`).emit("room:settings_updated", payload);
    }
  );

  socket.on("server:room:deleted", (payload: RoomDeletedPayload) => {
    io.to(`room:${payload.roomId}`).emit("room:deleted", payload);
  });

  // chat event handlers
  socket.on(
    "chat:typing",
    ({ roomId, isTyping }: { roomId: string; isTyping: boolean }) => {
      console.log(
        `[CHAT] Typing ${isTyping ? "start" : "stop"} from ${
          socket.id
        } in room ${roomId}`
      );

      socket.to(`room:${roomId}`).emit("chat:typing", {
        roomId,
        userId: socket.data.userId || "unknown",
        username: socket.data.username || "Unknown User",
        isTyping,
      });
    }
  );
});

httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});

export { io };
