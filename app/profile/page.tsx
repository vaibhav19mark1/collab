"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Camera, Mail, User, Calendar } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import axios from "axios";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stats, setStats] = useState({ created: 0, joined: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (session?.user) {
        try {
          const response = await axios.get("/api/user/stats");
          setStats(response.data);
        } catch (error) {
          console.error("Failed to fetch stats:", error);
        }
      }
    };
    fetchStats();
  }, [session]);

  if (status === "loading" && !session) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  const handleProfileUpdate = async (data: {
    image?: string;
    name?: string;
  }) => {
    await update({
      ...session,
      user: {
        ...session.user,
        ...(data.image && { image: data.image }),
        ...(data.name && { name: data.name }),
      },
    });
    setSelectedFile(null);
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsUploadModalOpen(true);
    }
    e.target.value = "";
  };

  const handleEditProfile = () => {
    setIsUploadModalOpen(true);
    setSelectedFile(null);
  };

  // Get initials
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0].toUpperCase() || "U";

  return (
    <div className="container py-6 max-w-7xl mx-auto">
      <div className="w-full max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        <div className="relative group">
          {/* Profile Card */}
          <div className="relative">
            <Card className="border shadow-sm bg-card">
              <CardContent className="flex flex-col md:flex-row items-center md:items-end gap-6">
                {/* Avatar */}
                <div className="relative group/avatar">
                  <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-xl text-3xl">
                    <AvatarImage
                      src={user.image || ""}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-4xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-2 right-2 rounded-full shadow-lg opacity-0 group-hover/avatar:opacity-100 transition-all duration-200 translate-y-2 group-hover/avatar:translate-y-0 cursor-pointer"
                    onClick={handleCameraClick}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left space-y-2 mb-2">
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">
                      {user.name}
                    </h1>
                    {user.isVerified && (
                      <Badge
                        variant="secondary"
                        className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200 dark:border-blue-800"
                      >
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 text-lg">
                    <span className="font-medium">@{user.username}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4 md:mt-0 mb-2">
                  <Button
                    onClick={handleEditProfile}
                    className="min-w-30"
                    variant="default"
                  >
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </h3>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  Email Address
                </label>
                <div className="flex items-center gap-3 text-foreground/90 bg-muted/50 p-3 rounded-md">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {user.email}
                </div>
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  Join Date
                </label>
                <div className="flex items-center gap-3 text-foreground/90 bg-muted/50 p-3 rounded-md">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Member since 2024</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <h3 className="font-semibold text-lg">Activity Stats</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-xl bg-primary/5 border border-primary/10 text-center hover:bg-primary/10 transition-colors">
                  <div className="text-3xl font-bold text-primary">
                    {stats.created}
                  </div>
                  <div className="text-sm text-muted-foreground font-semibold mt-2">
                    Rooms Created
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-primary/5 border border-primary/10 text-center hover:bg-primary/10 transition-colors">
                  <div className="text-3xl font-bold text-primary">
                    {stats.joined}
                  </div>
                  <div className="text-sm text-muted-foreground font-semibold mt-2">
                    Rooms Joined
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {isUploadModalOpen && (
          <EditProfileModal
            isOpen={isUploadModalOpen}
            onClose={() => {
              setIsUploadModalOpen(false);
              setSelectedFile(null);
            }}
            onUpdateSuccess={handleProfileUpdate}
            currentAvatar={user.image || ""}
            currentName={user.name || ""}
            userInitials={initials}
            initialFile={selectedFile}
          />
        )}
      </div>
    </div>
  );
}
