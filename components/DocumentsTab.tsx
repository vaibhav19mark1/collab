"use client";

import { Button } from "@/components/ui/button";
import axios from "axios";
import { FileText, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface Document {
  _id: string;
  title: string;
  type: string;
  createdAt: string;
}

interface DocumentTabProps {
  roomId: string;
  userId: string;
  username: string;
}

export const DocumentTab = ({ roomId }: DocumentTabProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [roomId]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`/api/rooms/${roomId}/document`);
      if (response.data.success) {
        const docs = response.data.documents;
        setDocuments(docs);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    setCreating(true);
    try {
      const response = await axios.post(`/api/rooms/${roomId}/document`, {
        title: `Document ${documents.length + 1}`,
        type: "richtext",
      });

      if (response.data.success) {
        const newDoc = response.data.document;
        setDocuments([newDoc, ...documents]);
        toast.success("Document created");
      }
    } catch (error) {
      console.error("Error creating document:", error);
      toast.error("Failed to create document");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={createDocument} disabled={creating} size="sm">
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </>
          )}
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/10 border-dashed">
          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground font-medium">No documents yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create a document to start collaborating
          </p>
          <Button
            onClick={createDocument}
            disabled={creating}
            variant="outline"
          >
            Create Document
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Link
              key={doc._id}
              href={`/rooms/${roomId}/documents/${doc._id}`}
              className="block group"
            >
              <div className="border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer h-full flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 bg-primary/10 text-primary rounded-md">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="font-medium truncate mb-1 group-hover:text-primary transition-colors">
                  {doc.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-auto">
                  Created {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
