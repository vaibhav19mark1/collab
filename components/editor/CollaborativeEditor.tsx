import { useYjs } from "@/contexts/YjsContext";
import { Loader2 } from "lucide-react";
import { EditorLayout } from "./EditorLayout";
import { EditorHeader } from "./EditorHeader";
import { Sidebar } from "./Sidebar";
import { Editor } from "./Editor";
import { FixedToolbar } from "./FixedToolbar";
import { useState } from "react";
import { Participant } from "@/types/room.types";
import { Editor as TiptapEditor } from "@tiptap/react";

interface CollaborativeEditorProps {
  documentTitle?: string;
  roomId?: string;
  participants?: Participant[];
  editable?: boolean;
}

export const CollaborativeEditor = ({
  documentTitle = "Untitled",
  roomId = "",
  participants = [],
  editable = true,
}: CollaborativeEditorProps) => {
  const { provider, doc, isConnected, synced } = useYjs();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editorInstance, setEditorInstance] = useState<TiptapEditor | null>(
    null
  );

  if (!provider || !doc) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <EditorLayout
      isSidebarOpen={isSidebarOpen}
      header={
        <>
          <EditorHeader
            editor={editorInstance}
            provider={provider}
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isConnected={isConnected}
            documentTitle={documentTitle}
            roomId={roomId}
            participants={participants}
          />
          {editorInstance && <FixedToolbar editor={editorInstance} />}
        </>
      }
      sidebar={<Sidebar editor={editorInstance} />}
    >
      <Editor
        doc={doc}
        provider={provider}
        editable={editable}
        isConnected={isConnected}
        synced={synced}
        onEditorReady={setEditorInstance}
      />
    </EditorLayout>
  );
};
