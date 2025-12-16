import { Doc as YjsDoc } from "yjs";
import { WebsocketProvider } from "y-websocket";

export interface YjsProviderConfig {
  documentId: string;
  userId: string;
  username: string;
  userColor: string;
}

export interface YjsContextValue {
  provider: WebsocketProvider | null;
  doc: YjsDoc | null;
  isConnected: boolean;
  synced: boolean;
}
