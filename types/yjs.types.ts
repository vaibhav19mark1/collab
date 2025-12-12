import { Doc as YjsDoc } from "yjs";

export interface YjsProviderConfig {
  documentId: string;
  userId: string;
  username: string;
  userColor: string;
}

export interface YjsContextValue {
  provider: any | null; // WebsocketProvider
  doc: YjsDoc | null;
  isConnected: boolean;
  synced: boolean;
}
