"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { YjsProvider } from "@/contexts/YjsContext";
import { CollaborativeEditor } from "@/components/editor/CollaborativeEditor";
import { toast } from "sonner";
import { Participant } from "@/types/room.types";

interface Document {
  id: string;
  title: string;
  content: Record<string, unknown>;
  roomId: string;
  createdAt: string;
  updatedAt: string;
}

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
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
        router.push(`/rooms/${roomId}`);
      } finally {
        setLoading(false);
      }
    };

    if (roomId && documentId) {
      fetchData();
    }
  }, [roomId, documentId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!document || !user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex-1 overflow-hidden">
        <YjsProvider
          config={{
            roomId: documentId, // Use documentId as the Yjs room ID for isolation
            userId: user.id,
            username: user.name,
            userColor: user.color,
          }}
        >
          {/* <></> */}
          <CollaborativeEditor
            editable={true}
            documentTitle={document.title}
            roomId={roomId}
            participants={participants}
          />
        </YjsProvider>
      </div>
    </div>
  );
}
