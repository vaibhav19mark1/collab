import { useSocketContext } from "@/contexts/SocketContext";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types/socket.types";
import { useCallback } from "react";

export const useSocket = () => {
  const { isConnected, socket, status } = useSocketContext();

  const emit = useCallback(
    <T extends keyof ClientToServerEvents>(
      event: T,
      ...args: Parameters<ClientToServerEvents[T]>
    ) => {
      if (!socket || !isConnected) return;
      socket.emit(event, ...args);
    },
    [socket, isConnected]
  );

  const on = useCallback(
    <T extends keyof ServerToClientEvents>(
      event: T,
      handler: ServerToClientEvents[T]
    ) => {
      if (!socket) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.on(event, handler as any);
    },
    [socket]
  );

  const off = useCallback(
    <T extends keyof ServerToClientEvents>(
      event: T,
      handler: ServerToClientEvents[T]
    ) => {
      if (!socket) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.off(event, handler as any);
    },
    [socket]
  );

  return {
    isConnected,
    socket,
    status,
    emit,
    on,
    off,
  };
};
