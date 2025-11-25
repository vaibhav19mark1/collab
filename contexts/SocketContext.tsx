"use client";

import { useUIStore } from "@/stores/uiStore";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types/socket.types";
import { useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextValue {
  socket: TypedSocket | null;
  isConnected: boolean;
  status: "connected" | "connecting" | "disconnected" | "reconnecting";
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  status: "disconnected",
});

const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }
  return context;
};

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status: sessionStatus } = useSession();
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] =
    useState<SocketContextValue["status"]>("disconnected");
    
  useEffect(() => {
    if (sessionStatus !== "authenticated" || !session) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

    const newSocket: TypedSocket = io(socketUrl, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 3,
    });

    newSocket.on("connect", () => {
      console.log("Socket.io connected");
      setIsConnected(true);
      setStatus("connected");
      useUIStore.getState().setSocketStatus("connected");
    });

    newSocket.on("disconnect", () => {
      console.log("Socket.io disconnected");
      setIsConnected(false);
      setStatus("disconnected");
      useUIStore.getState().setSocketStatus("disconnected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setStatus("reconnecting");
      useUIStore.getState().setSocketStatus("reconnecting");
    });

    newSocket.io.on("reconnect_attempt", () => {
      console.log("🔄 Attempting to reconnect...");
      setStatus("reconnecting");
      useUIStore.getState().setSocketStatus("reconnecting");
    });

    newSocket.io.on("reconnect", () => {
      console.log("Socket.io reconnected");
      setIsConnected(true);
      setStatus("connected");
      useUIStore.getState().setSocketStatus("connected");
    });

    newSocket.io.on("reconnect_failed", () => {
      console.error("❌ Socket.io reconnection failed");
      setStatus("disconnected");
      useUIStore.getState().setSocketStatus("disconnected");
    });

    setSocket(newSocket);

    return () => {
      console.log("Disconnecting socket.io client...");
      newSocket.close();
    };
  }, [sessionStatus]);

  const value: SocketContextValue = {
    socket,
    isConnected,
    status,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export { SocketProvider, useSocketContext };
