"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LayoutDashboard, Users, LogOut, User } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { generateColor } from "@/lib/helper";

export function Header() {
  const { data: session, status } = useSession();

  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  // Don't show header on login page, or if unauthenticated, or if initial loading without session
  if (
    pathname === "/login" ||
    pathname === "/" ||
    status === "unauthenticated" ||
    (status === "loading" && !session)
  ) {
    return null;
  }

  const handleRedirect = (path: string) => {
    if (pathname !== path) {
      router.push(path);
    }
  };
  const userColor = generateColor(session?.user?.username || "Unknown");
  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <nav className="w-full z-50 bg-background/80 backdrop-blur-sm shadow-sm border-b sticky top-0">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <Image
              src={`/logo-${resolvedTheme}2.png`}
              alt="Collab Logo"
              className="cursor-pointer"
              width={120}
              height={100}
              onClick={() => handleRedirect("/dashboard")}
            />
            {/* Navigation Links */}
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant={pathname === "/dashboard" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleRedirect("/dashboard")}
                className="flex items-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <Button
                variant={pathname.startsWith("/rooms") ? "default" : "ghost"}
                size="sm"
                onClick={() => handleRedirect("/rooms")}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Rooms</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />

            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Avatar
                        className={`h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity`}
                      >
                        <AvatarImage
                          src={session?.user?.image || ""}
                          alt={session?.user?.name || ""}
                        />
                        <AvatarFallback
                          style={{ backgroundColor: userColor, color: "white" }}
                        >
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{session?.user?.name || "User"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleRedirect("/profile")}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4 text-destructive" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
