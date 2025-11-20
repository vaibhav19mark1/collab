"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Search, X, Check, Mail } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  onInvitesSent: () => void;
}

export function InviteModal({
  open,
  onOpenChange,
  roomId,
  onInvitesSent,
}: InviteModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{_id: string; username: string; email: string}>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Array<{_id: string; username: string; email: string}>>([]);
  const [customEmail, setCustomEmail] = useState("");
  const [inviteTab, setInviteTab] = useState<"users" | "email">("users");
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  const searchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(`/api/users/search`, {
        params: { q: query, roomId: roomId }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error("User search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

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
  }, [searchQuery, inviteTab]);

  const toggleUserSelection = (user: {_id: string; username: string; email: string}) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
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

  const handleSendInvites = async () => {
    setIsGeneratingInvite(true);
    try {
      const emailsToInvite = inviteTab === "users" 
        ? selectedUsers.map(u => u.email)
        : [customEmail];

      if (emailsToInvite.length === 0) {
        toast.error("Please select users or enter an email");
        setIsGeneratingInvite(false);
        return;
      }

      const results = await Promise.allSettled(
        emailsToInvite.map(email => 
          axios.post(`/api/rooms/${roomId}/invite`, { 
            expiryDays: 7,
            inviteeEmail: email 
          })
        )
      );

      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;

      if (successful > 0) {
        toast.success(`${successful} invite${successful > 1 ? 's' : ''} sent successfully!`);
        onInvitesSent();
        onOpenChange(false);
        setSelectedUsers([]);
        setCustomEmail("");
        setSearchQuery("");
      }

      if (failed > 0) {
        toast.error(`${failed} invite${failed > 1 ? 's' : ''} failed to send`);
      }
    } catch {
      toast.error("Failed to send invites");
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Invites</DialogTitle>
          <DialogDescription>
            Search for registered users or enter an email address to send room invitations.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={inviteTab} onValueChange={(v) => setInviteTab(v as "users" | "email")}>
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
                  {selectedUsers.map(user => (
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
                <div className="border rounded-md max-h-[200px] overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="divide-y">
                      {searchResults.map(user => {
                        const isSelected = selectedUsers.find(u => u._id === user._id);
                        return (
                          <div
                            key={user._id}
                            onClick={() => toggleUserSelection(user)}
                            className={`p-3 cursor-pointer hover:bg-secondary/50 transition-colors ${
                              isSelected ? 'bg-secondary' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{user.username}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
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
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
              />
              {customEmail && !isValidEmail(customEmail) && (
                <p className="text-xs text-destructive">Please enter a valid email address</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedUsers([]);
              setCustomEmail("");
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
              (inviteTab === "email" && (!customEmail || !isValidEmail(customEmail)))
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
                Send Invite{inviteTab === "users" && selectedUsers.length > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
