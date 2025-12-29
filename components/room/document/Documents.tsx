"use client";

import { Button } from "@/components/ui/button";
import axios from "axios";
import {
  FileText,
  Loader2,
  Plus,
  MoreVertical,
  Pencil,
  Trash,
  Code,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentModal } from "./DocumentModal";
import { ConfirmDialog } from "../../ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export const Documents = ({ roomId }: DocumentTabProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

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

  const createDocument = async (title: string, type: string) => {
    try {
      const response = await axios.post(`/api/rooms/${roomId}/document`, {
        title,
        type,
      });

      if (response.data.success) {
        const newDoc = response.data.document;
        setDocuments([newDoc, ...documents]);
        toast.success("Document created");
        setModalOpen(false);
      }
    } catch (error) {
      console.error("Error creating document:", error);
      toast.error("Failed to create document");
    }
  };

  const deleteDocument = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`/api/rooms/${roomId}/document/${deleteId}`);
      setDocuments(documents.filter((d) => d._id !== deleteId));
      toast.success("Document deleted");
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const renameDocument = async () => {
    if (!editingDoc) return;
    setIsRenaming(true);
    try {
      await axios.patch(`/api/rooms/${roomId}/document/${editingDoc._id}`, {
        title: editName,
      });

      setDocuments(
        documents.map((d) =>
          d._id === editingDoc._id ? { ...d, title: editName } : d
        )
      );
      toast.success("Document renamed");
      setEditingDoc(null);
    } catch (error) {
      console.error("Error renaming document:", error);
      toast.error("Failed to rename document");
    } finally {
      setIsRenaming(false);
    }
  };

  const openRenameModal = (doc: Document) => {
    setEditingDoc(doc);
    setEditName(doc.title);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex justify-between items-center">
        <div className="space-y-1.5">
          <CardTitle>Collaborative Documents</CardTitle>
          <CardDescription>
            Create and edit documents together in real-time
          </CardDescription>
        </div>
        <div>
          <Button onClick={() => setModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/10 border-dashed">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground font-medium">
                No documents yet
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Create a document to start collaborating
              </p>
              <Button onClick={() => setModalOpen(true)} variant="outline">
                Create Document
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => (
                <div key={doc._id} className="group relative">
                  <Link
                    href={`/rooms/${roomId}/documents/${doc._id}`}
                    className="block h-full"
                  >
                    <div className="border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer h-full flex flex-col">
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-primary/10 text-primary rounded-md">
                          {doc.type === "code" ? (
                            <Code className="h-5 w-5" />
                          ) : (
                            <FileText className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                      <h3 className="font-medium truncate mb-1 pr-6 group-hover:text-primary transition-colors">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-auto">
                        Created {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity has-[[data-state=open]]:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openRenameModal(doc)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(doc._id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}

          <DocumentModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            onSubmit={createDocument}
          />

          <ConfirmDialog
            open={!!deleteId}
            onOpenChange={(open) => !open && setDeleteId(null)}
            title="Delete Document"
            description="Are you sure you want to delete this document? This action cannot be undone."
            confirmText="Delete"
            variant="destructive"
            onConfirm={deleteDocument}
          />

          <Dialog
            open={!!editingDoc}
            onOpenChange={(open) => !open && setEditingDoc(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="doc-name">Name</Label>
                  <Input
                    id="doc-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Document Name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditingDoc(null)}
                  disabled={isRenaming}
                >
                  Cancel
                </Button>
                <Button
                  onClick={renameDocument}
                  disabled={isRenaming || !editName.trim()}
                >
                  {isRenaming && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
