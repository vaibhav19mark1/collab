import { YjsContextValue, YjsProviderConfig } from "@/types/yjs.types";
import { Doc as YjsDoc } from "yjs";
import { WebsocketProvider } from "y-websocket";
import { createContext, useContext, useEffect, useState } from "react";

const YjsContext = createContext<YjsContextValue>({
  provider: null,
  doc: null,
  isConnected: false,
  synced: false,
});

const YjsProvider = ({
  children,
  config,
}: {
  children: React.ReactNode;
  config: YjsProviderConfig | null;
}) => {
  const [doc, setDoc] = useState<YjsDoc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!config) return;

    const yjsDoc = new YjsDoc();
    const wsUrl = process.env.NEXT_PUBLIC_YJS_URL || "ws://localhost:3002";
    const wsProvider = new WebsocketProvider(
      wsUrl,
      `room:${config.roomId}`,
      yjsDoc,
      { connect: true }
    );

    wsProvider.awareness.setLocalStateField("user", {
      id: config.userId,
      name: config.username,
      color: config.userColor,
    });

    wsProvider.on("status", (event: { status: string }) => {
      setIsConnected(event.status === "connected");
      console.log(`[YJS] Connection status: ${event.status}`);
    });

    wsProvider.on("sync", (isSynced: boolean) => {
      setSynced(isSynced);
      console.log(`[YJS] Sync status: ${isSynced}`);
    });

    setDoc(yjsDoc);
    setProvider(wsProvider);

    return () => {
      wsProvider.destroy();
      yjsDoc.destroy();
      setIsConnected(false);
      setSynced(false);
    };
  }, [config]);

  return (
    <YjsContext.Provider value={{ provider, doc, isConnected, synced }}>
      {children}
    </YjsContext.Provider>
  );
};

const useYjs = () => {
  const context = useContext(YjsContext);
  if (!context) {
    throw new Error("useYjs must be used within a YjsProvider");
  }
  return context;
};

export { YjsProvider, useYjs };
