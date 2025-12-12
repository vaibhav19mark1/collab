"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, Code, Presentation, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    title: string,
    type: "editor" | "code" | "whiteboard"
  ) => Promise<void>;
}

const types = [
  {
    id: "editor",
    label: "Text Editor",
    icon: FileText,
    disabled: false,
    description: "Collaborative text editor",
  },
  {
    id: "code",
    label: "Code",
    icon: Code,
    disabled: true,
    description: "Code editor (Coming soon)",
  },
  {
    id: "whiteboard",
    label: "Whiteboard",
    icon: Presentation,
    disabled: true,
    description: "Visual canvas (Coming soon)",
  },
] as const;

export function DocumentModal({
  open,
  onOpenChange,
  onSubmit,
}: NewDocumentModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"editor" | "code" | "whiteboard">("editor");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit(title, type);
      onOpenChange(false);
      setTitle("");
      setType("editor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Document Name</Label>
            <Input
              id="name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Project Requirements"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Document Type</Label>
            <div className="grid grid-cols-3 gap-3">
              {types.map(({ icon: Icon, id, label, disabled }) => {
                const isSelected = type === id;
                return (
                  <div
                    key={id}
                    onClick={() => !disabled && setType(id)}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-muted bg-transparent",
                      disabled &&
                        "opacity-50 cursor-not-allowed hover:bg-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-8 w-8 mb-2",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {types.find(({ id }) => id === type)?.description}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
