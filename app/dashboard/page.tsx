"use client";

import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Plus, LogIn, Telescope } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  if (status === "loading") {
    return <DashboardSkeleton />;
  }

  if (!session) return null;

  return (
    <div className="min-h-full bg-background/50">
      <main className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-primary">
              {greeting}, {session.user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-muted-foreground text-lg">
              Ready to collaborate and create something amazing today?
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card
                className="group relative overflow-hidden cursor-pointer hover:shadow-md transition-all border-primary/20 hover:border-primary/50"
                onClick={() => router.push("/rooms?action=create")}
              >
                <CardHeader>
                  <div className="p-3 bg-primary/10 w-fit rounded-lg mb-2 group-hover:scale-110 transition-transform duration-300">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Create Room</CardTitle>
                  <CardDescription>
                    Start a new collaborative session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-primary font-medium mt-2">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
              <Card
                className="group relative overflow-hidden cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                onClick={() => router.push("/rooms?action=join")}
              >
                <CardHeader>
                  <div className="p-3 bg-primary/10 w-fit rounded-lg mb-2 group-hover:scale-110 transition-transform duration-300">
                    <LogIn className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Join Room</CardTitle>
                  <CardDescription>Enter an existing room code</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-primary font-medium mt-2">
                    Join Rooms <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
              <Card
                className="group relative overflow-hidden cursor-pointer hover:shadow-md transition-all border-primary/20 hover:border-primary/50"
                onClick={() => router.push("/rooms")}
              >
                <CardHeader>
                  <div className="p-3 bg-primary/10 w-fit rounded-lg mb-2 group-hover:scale-110 transition-transform duration-300">
                    <Telescope className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Explore Rooms</CardTitle>
                  <CardDescription>
                    Browse and join existing collaborative sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-primary font-medium mt-2">
                    Browse Rooms <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
