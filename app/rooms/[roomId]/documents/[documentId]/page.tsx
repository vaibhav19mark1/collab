"use client";

import { useEffect, useState, useMemo, startTransition, JSX } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { YjsProvider } from "@/contexts/YjsContext";
import { CollaborativeEditor } from "@/components/editor/CollaborativeEditor";
import { MonacoEditor } from "@/components/monaco";
import { CollaborativeWhiteboard } from "@/components/whiteboard/CollaborativeWhiteboard";
import { toast } from "sonner";
import { Participant } from "@/types/room.types";
import RoomChat from "@/components/RoomChat";
import { useUIStore } from "@/stores/uiStore";
import { useTheme } from "next-themes";

interface Document {
  id: string;
  title: string;
  type: "editor" | "code" | "whiteboard";
  content: Record<string, unknown>;
  roomId: string;
  createdAt: string;
  updatedAt: string;
}

type DocumentType = Document["type"];

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const roomId = params.roomId as string;
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{
    id: string;
    name: string;
    color: string;
  } | null>(null);

  const setActiveRoomId = useUIStore((s) => s.setActiveRoomId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch document
        const docResponse = await axios.get(
          `/api/rooms/${roomId}/document/${documentId}`
        );
        setDocument(docResponse.data.document);
        setUser(docResponse.data.user);

        // Fetch room participants
        const roomResponse = await axios.get(`/api/rooms/${roomId}`);
        setParticipants(roomResponse.data.room.participants || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch document");
        startTransition(() => {
          router.push(`/rooms/${roomId}`);
        });
      } finally {
        setLoading(false);
      }
    };

    if (roomId && documentId) {
      fetchData();
      setActiveRoomId(roomId);
    }

    return () => setActiveRoomId(null);
  }, [roomId, documentId, router, setActiveRoomId]);

  // Memoize config to prevent provider recreation
  // Must be before conditional returns to follow Rules of Hooks
  const yjsConfig = useMemo(
    () =>
      user && documentId
        ? {
            documentId,
            userId: user.id,
            username: user.name,
            userColor: user.color,
          }
        : null,
    [documentId, user]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!document || !user || !yjsConfig) {
    return null;
  }

  const documentRenderers: Record<DocumentType, JSX.Element> = {
    code: (
      <MonacoEditor
        documentTitle={document.title}
        initialLanguage="typescript"
        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
        enableToolbar
        enableDownload
        enableCopy
        roomId={roomId}
        participants={participants}
      />
    ),

    editor: (
      <CollaborativeEditor
        editable
        documentTitle={document.title}
        roomId={roomId}
        participants={participants}
      />
    ),

    whiteboard: (
      <CollaborativeWhiteboard
        editable
        documentTitle={document.title}
        roomId={roomId}
        participants={participants}
      />
    ),
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-hidden">
        <YjsProvider config={yjsConfig}>
          {documentRenderers[document.type]}
        </YjsProvider>
      </div>
      <RoomChat roomId={roomId} />
    </div>
  );
}
