import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import * as Y from "yjs";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";

const YJS_PORT = process.env.YJS_PORT || 3002;

/**
 * Yjs Protocol Message Types
 * 0: Sync - Exchange document content updates
 * 1: Awareness - Exchange cursor positions and user presence
 */
const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

/**
 * DocumentHandler
 * Manages a single Yjs document and all clients connected to it.
 * Handles broadcasting updates between clients.
 */
class DocumentHandler {
  name: string;
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  clients: Set<WebSocket>;

  constructor(name: string) {
    this.name = name;
    // Create a new Yjs document
    this.doc = new Y.Doc();
    // Create awareness instance for this document (handles cursors/presence)
    this.awareness = new awarenessProtocol.Awareness(this.doc);
    this.clients = new Set();

    // LISTENER 1: Handle Document Updates
    // When the document content changes (someone types), broadcast the update to everyone else
    this.doc.on("update", (update: Uint8Array) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeUpdate(encoder, update);
      const message = encoding.toUint8Array(encoder);

      this.broadcast(message, null); // Broadcast to all
    });

    // LISTENER 2: Handle Awareness Updates
    // When cursors move or users join/leave, broadcast the change
    this.awareness.on("update", ({ added, updated, removed }: any) => {
      const changedClients = added.concat(updated).concat(removed);
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
      );
      const message = encoding.toUint8Array(encoder);

      this.broadcast(message, null);
    });
  }

  /**
   * Broadcast a message to connected clients.
   * @param message The binary message to send
   * @param source The client who sent the update (optional, to avoid echoing back)
   */
  broadcast(message: Uint8Array, source: WebSocket | null) {
    this.clients.forEach((client) => {
      if (client !== source && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// Global map to store active documents in memory
// Key: Document Name (e.g., "room:123"), Value: DocumentHandler
const documents = new Map<string, DocumentHandler>();

/**
 * Get or create a DocumentHandler for a given document name
 */
const getDocument = (name: string): DocumentHandler => {
  if (!documents.has(name)) {
    console.log(`[YJS] Creating new document: ${name}`);
    documents.set(name, new DocumentHandler(name));
  }
  return documents.get(name)!;
};

// Setup HTTP and WebSocket Server
const server = createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (conn, req) => {
  // 1. Parse the URL to get the document name
  // Example: ws://localhost:3002/room:my-document-id
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const docName = url.pathname.slice(1); // Remove leading slash

  if (!docName) {
    console.log("[YJS] Connection rejected: no document name");
    conn.close();
    return;
  }

  console.log(`[YJS] Client connected to: ${docName}`);

  // 2. Get the document handler and register this client
  const docHandler = getDocument(docName);
  docHandler.clients.add(conn);

  // 3. Initialize the connection
  // Send the initial sync step (offer) to the client
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MESSAGE_SYNC);
  syncProtocol.writeSyncStep1(encoder, docHandler.doc);
  conn.send(encoding.toUint8Array(encoder));

  // Send current awareness states (who is already online)
  const awarenessStates = docHandler.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(
        docHandler.awareness,
        Array.from(awarenessStates.keys())
      )
    );
    conn.send(encoding.toUint8Array(awarenessEncoder));
  }

  // 4. Handle incoming messages from the client
  conn.on("message", (message: Buffer) => {
    try {
      const encoder = encoding.createEncoder();
      const decoder = decoding.createDecoder(new Uint8Array(message));
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MESSAGE_SYNC:
          // Handle document content sync
          encoding.writeVarUint(encoder, MESSAGE_SYNC);
          syncProtocol.readSyncMessage(decoder, encoder, docHandler.doc, conn);

          // If the sync protocol generated a reply, send it back
          if (encoding.length(encoder) > 1) {
            conn.send(encoding.toUint8Array(encoder));
          }
          break;

        case MESSAGE_AWARENESS:
          // Handle cursor/presence updates
          awarenessProtocol.applyAwarenessUpdate(
            docHandler.awareness,
            decoding.readVarUint8Array(decoder),
            conn
          );
          break;
      }
    } catch (err) {
      console.error("[YJS] Error handling message:", err);
    }
  });

  // 5. Handle Disconnection
  conn.on("close", () => {
    console.log(`[YJS] Client disconnected from: ${docName}`);
    docHandler.clients.delete(conn);

    // Cleanup: If no clients left, remove the document from memory after a delay
    if (docHandler.clients.size === 0) {
      setTimeout(() => {
        if (docHandler.clients.size === 0) {
          console.log(`[YJS] Cleaning up empty document: ${docName}`);
          documents.delete(docName);
        }
      }, 30000); // 30 seconds timeout
    }
  });
});

server.listen(YJS_PORT, () => {
  console.log(`Yjs WebSocket server running on port ${YJS_PORT}`);
});

export { wss };
