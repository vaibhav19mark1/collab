"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface RoomSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  currentSettings: {
    name: string;
    description?: string;
    isPrivate: boolean;
    hasPassword: boolean;
    maxParticipants: number;
  };
  onSettingsUpdated?: (updates: {
    name: string;
    description?: string;
    isPrivate: boolean;
    maxParticipants: number;
  }) => void;
}

export function RoomSettingsModal({
  open,
  onOpenChange,
  roomId,
  currentSettings,
  onSettingsUpdated,
}: RoomSettingsModalProps) {
  const [name, setName] = useState(currentSettings.name);
  const [description, setDescription] = useState(
    currentSettings.description || ""
  );
  const [isPrivate, setIsPrivate] = useState(currentSettings.isPrivate);
  const [maxParticipants, setMaxParticipants] = useState(
    currentSettings.maxParticipants
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [removePassword, setRemovePassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      toast.error("Room name is required");
      return;
    }

    if (maxParticipants < 2 || maxParticipants > 100) {
      toast.error("Max participants must be between 2 and 100");
      return;
    }

    if (password && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password && password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }

    setIsUpdating(true);

    try {
      const payload: {
        name: string;
        description: string;
        maxParticipants: number;
        isPrivate: boolean;
        password?: string;
      } = {
        name: name.trim(),
        description: description.trim(),
        maxParticipants,
        isPrivate,
      };

      // Handle password changes
      if (removePassword) {
        payload.password = "";
      } else if (password) {
        payload.password = password;
      }

      await axios.put(`/api/rooms/${roomId}/settings`, payload);

      toast.success("Room settings updated successfully");

      // Call the callback with updated settings for optimistic update
      onSettingsUpdated?.({
        name: payload.name,
        description: payload.description,
        isPrivate: payload.isPrivate,
        maxParticipants: payload.maxParticipants,
      });

      onOpenChange(false);

      // Reset form
      setPassword("");
      setConfirmPassword("");
      setRemovePassword(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to update settings");
      } else {
        toast.error("Failed to update settings");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Room Settings</DialogTitle>
          <DialogDescription>
            Update room details, privacy settings, and access control.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Room Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter room name"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter room description (optional)"
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="2"
                max="100"
                value={maxParticipants}
                onChange={(e) =>
                  setMaxParticipants(parseInt(e.target.value) || 2)
                }
              />
              <p className="text-xs text-muted-foreground">
                Between 2 and 100 participants
              </p>
            </div>

            {!currentSettings.hasPassword && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isPrivate">Private Room</Label>
                  <p className="text-xs text-muted-foreground">
                    Requires invite link or room code to join
                  </p>
                </div>
                <Switch
                  id="isPrivate"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-4 pt-4">
            {currentSettings.hasPassword && !removePassword && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Password Protected
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      This room is currently password protected. Users need the
                      password to join.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setRemovePassword(true)}
                    >
                      <Unlock className="h-4 w-4 mr-2" />
                      Remove Password
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {removePassword && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                <div className="flex items-start gap-3">
                  <Unlock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-amber-900 dark:text-amber-100">
                      Remove Password Protection
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      The room password will be removed. Anyone with the room
                      code can join.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setRemovePassword(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!currentSettings.hasPassword && !removePassword && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Set Password (Optional)</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Setting a password will make the room private and require the
                  password to join.
                </p>
              </div>
            )}

            {currentSettings.hasPassword && !removePassword && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="updatePassword">
                    Update Password (Optional)
                  </Label>
                  <Input
                    id="updatePassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmUpdatePassword">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmUpdatePassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Leave blank to keep the current password.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
