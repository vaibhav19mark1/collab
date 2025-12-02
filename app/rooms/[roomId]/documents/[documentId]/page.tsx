"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { YjsProvider } from "@/contexts/YjsContext";
import CollaborativeEditor from "@/components/editor/CollaborativeEditor";
import { toast } from "sonner";

interface Document {
  _id: string;
  title: string;
  type: string;
  roomId: string;
}

export default function DocumentPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await axios.get(
          `/api/rooms/${roomId}/document/${documentId}`
        );
        if (response.data.success) {
          setDocument(response.data.document);
        }
      } catch (error) {
        console.error("Error fetching document:", error);
        toast.error("Failed to load document");
        router.push(`/rooms/${roomId}`);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchDocument();
    }
  }, [roomId, documentId, session, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!document || !session?.user) {
    return null;
  }

  const userColor = `#${session.user._id.slice(0, 6)}`;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/rooms/${roomId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Room
        </Button>
        <div className="h-6 w-px bg-border" />
        <h1 className="font-semibold text-lg">{document.title}</h1>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden p-4 md:p-8 max-w-5xl mx-auto w-full">
        <YjsProvider
          config={{
            roomId: documentId, // Use document ID as the Yjs room ID
            userId: session.user._id,
            username: session.user.username as string,
            userColor,
          }}
        >
          <CollaborativeEditor className="h-full min-h-[calc(100vh-8rem)]" />
        </YjsProvider>
      </div>
    </div>
  );
}
