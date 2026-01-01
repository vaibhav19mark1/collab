"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, X, Check, Mail, Copy } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
}

export function InviteModal({ open, onOpenChange, roomId }: InviteModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ _id: string; username: string; email: string }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<
    Array<{ _id: string; username: string; email: string }>
  >([]);
  const [customEmails, setCustomEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [inviteTab, setInviteTab] = useState<"users" | "email">("users");
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const searchUsers = useCallback(
    async (query: string) => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await axios.get(`/api/users/search`, {
          params: { q: query, roomId: roomId },
        });
        setSearchResults(response.data);
      } catch (error) {
        console.error("User search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [roomId]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && inviteTab === "users") {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, inviteTab, searchUsers]);

  const toggleUserSelection = (user: {
    _id: string;
    username: string;
    email: string;
  }) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.find((u) => u._id === user._id);
      if (isSelected) {
        return prev.filter((u) => u._id !== user._id);
      } else if (prev.length < 5) {
        return [...prev, user];
      } else {
        toast.error("You can only select up to 5 users");
        return prev;
      }
    });
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim();

    if (!trimmedEmail) return;

    if (!isValidEmail(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (customEmails.includes(trimmedEmail)) {
      toast.error("This email has already been added");
      return;
    }

    if (customEmails.length >= 5) {
      toast.error("You can only add up to 5 email addresses");
      return;
    }

    setCustomEmails([...customEmails, trimmedEmail]);
    setEmailInput("");
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setCustomEmails(customEmails.filter((email) => email !== emailToRemove));
  };

  const handleEmailInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleSendInvites = async () => {
    setIsGeneratingInvite(true);
    try {
      const emailsToInvite =
        inviteTab === "users"
          ? selectedUsers.map((u) => u.email)
          : customEmails;

      if (emailsToInvite.length === 0) {
        toast.error("Please select users or enter an email");
        setIsGeneratingInvite(false);
        return;
      }

      // Send all invites in a single batch API call
      const response = await axios.post(`/api/rooms/${roomId}/invite`, {
        expiryDays: 7,
        inviteeEmails: emailsToInvite,
      });

      // Handle response
      if (response.data.success) {
        const { results } = response.data;

        if (results) {
          // Batch response
          const { successful, failed } = results;

          if (successful > 0) {
            toast.success(
              `${successful} invite${
                successful > 1 ? "s" : ""
              } sent successfully!`
            );
          }

          if (failed > 0) {
            toast.error(
              `${failed} invite${failed > 1 ? "s" : ""} failed to send`
            );
          }
        } else {
          // Single invite response (backward compatibility)
          toast.success("Invite sent successfully!");
        }
        onOpenChange(false);
        setSelectedUsers([]);
        setCustomEmails([]);
        setEmailInput("");
        setSearchQuery("");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to send invites");
      } else {
        toast.error("Failed to send invites");
      }
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleCopyInviteLink = async () => {
    setIsCopyingLink(true);
    try {
      const response = await axios.post(`/api/rooms/${roomId}/invite`, {
        expiryDays: 7,
      });

      const inviteUrl = response.data.inviteUrl;
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success("Invite link copied to clipboard!");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.error || "Failed to generate invite link"
        );
      } else {
        toast.error("Failed to generate invite link");
      }
    } finally {
      setIsCopyingLink(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Send Invites</DialogTitle>
          <DialogDescription>
            Search for registered users or enter an email address to send room
            invitations.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={inviteTab}
          onValueChange={(v) => setInviteTab(v as "users" | "email")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Search Users</TabsTrigger>
            <TabsTrigger value="email">Enter Email</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="space-y-2">
                <Label>Selected ({selectedUsers.length}/5)</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                    >
                      <span>{user.username}</span>
                      <button
                        onClick={() => toggleUserSelection(user)}
                        className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchQuery && (
              <div className="space-y-2">
                <Label>Results</Label>
                <div className="border rounded-md max-h-50 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="divide-y">
                      {searchResults.map((user) => {
                        const isSelected = selectedUsers.find(
                          (u) => u._id === user._id
                        );
                        return (
                          <div
                            key={user._id}
                            onClick={() => toggleUserSelection(user)}
                            className={`p-3 cursor-pointer hover:bg-secondary/50 transition-colors ${
                              isSelected ? "bg-secondary" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">
                                  {user.username}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {user.email}
                                </p>
                              </div>
                              {isSelected && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No users found
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Addresses ({customEmails.length}/5)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com (Press Enter to add)"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleEmailInputKeyDown}
                  disabled={customEmails.length >= 5}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddEmail}
                  disabled={!emailInput.trim() || customEmails.length >= 5}
                >
                  Add
                </Button>
              </div>
              {emailInput && !isValidEmail(emailInput) && (
                <p className="text-xs text-destructive">
                  Please enter a valid email address
                </p>
              )}
            </div>

            {/* Added Emails */}
            {customEmails.length > 0 && (
              <div className="space-y-2">
                <Label>Added Emails</Label>
                <div className="flex flex-wrap gap-2">
                  {customEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                    >
                      <span>{email}</span>
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between gap-2 mt-4">
          <Button
            variant="outline"
            onClick={handleCopyInviteLink}
            disabled={isCopyingLink}
          >
            {isCopyingLink ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : copiedLink ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSelectedUsers([]);
                setCustomEmails([]);
                setEmailInput("");
                setSearchQuery("");
              }}
              disabled={isGeneratingInvite}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvites}
              disabled={
                isGeneratingInvite ||
                (inviteTab === "users" && selectedUsers.length === 0) ||
                (inviteTab === "email" && customEmails.length === 0)
              }
            >
              {isGeneratingInvite ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invite
                  {(inviteTab === "users" && selectedUsers.length > 1) ||
                  (inviteTab === "email" && customEmails.length > 1)
                    ? "s"
                    : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
