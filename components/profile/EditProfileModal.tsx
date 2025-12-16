"use client";

import axios from "axios";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
export function EditProfileModal({
  isOpen,
  onClose,
  onUpdateSuccess,
  currentAvatar,
  currentName,
  userInitials,
  initialFile,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess: (data: { image?: string; name?: string }) => void;
  currentAvatar?: string;
  currentName: string;
  userInitials: string;
  initialFile?: File | null;
}) {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [preview, setPreview] = useState<string | null>(
    initialFile ? URL.createObjectURL(initialFile) : currentAvatar || null
  );
  const [name, setName] = useState(currentName);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (initialFile && file !== initialFile && !isUploading) {
    setFile(initialFile);
    setPreview(URL.createObjectURL(initialFile));
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  };

  const activePreview = preview;

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    setIsUploading(true);
    let newImageUrl = currentAvatar;
    let nameUpdated = false;

    try {
      // 1. Upload Image if changed
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await axios.post("/api/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        newImageUrl = uploadResponse.data.url;
      }

      // 2. Update Name if changed
      if (name !== currentName) {
        // Use axios for patch
        await axios.patch("/api/user/update", { name });
        nameUpdated = true;
      }

      if (!file && !nameUpdated) {
        onClose();
        setIsUploading(false);
        return;
      }

      onUpdateSuccess({
        image: newImageUrl,
        name: nameUpdated ? name : currentName,
      });

      toast.success("Profile updated successfully");
      onClose();
      setFile(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(currentAvatar || null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-6 py-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-muted/50 relative bg-muted flex items-center justify-center shadow-xl">
              <Avatar className="h-full w-full bg-transparent">
                <AvatarImage
                  src={activePreview || ""}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-4xl w-full h-full flex items-center justify-center">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer backdrop-blur-sm z-10"
            >
              <Upload className="w-8 h-8 text-white drop-shadow-lg" />
            </button>
          </div>

          <div className="w-full flex flex-col gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Display Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <Input
              ref={fileInputRef}
              id="picture"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                Change Picture
              </Button>

              {file && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                >
                  Revert to current picture
                </Button>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-between gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUploading}
            className="bg-primary hover:bg-primary/90"
          >
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
