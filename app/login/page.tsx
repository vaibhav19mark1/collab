"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Lock, UserCheck, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

type AuthMode = "login" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const isSigningUp = mode === "signup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { username = "", email = "", password = "" } = formData;
      if (isSigningUp) {
        // Validate signup fields
        if (!username.trim()) {
          setError("Username is required");
          setIsLoading(false);
          return;
        }
        if (username.length < 2) {
          setError("Username must be at least 2 characters");
          setIsLoading(false);
          return;
        }
        if (!email.trim()) {
          setError("Email is required");
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters");
          setIsLoading(false);
          return;
        }

        // Handle signup via custom registration endpoint
        await axios.post("/api/auth/register", {
          username: username.trim(),
          email: email.trim(),
          password: password,
        });

        // After successful registration, automatically sign in using NextAuth
        const signInResult = await signIn("credentials", {
          email: email.trim(),
          password: password,
          redirect: false,
        });

        if (signInResult?.error) {
          setError(
            "Registration successful, but automatic sign in failed. Please try logging in manually."
          );
        } else if (signInResult?.ok) {
          // Check for pending invite
          const pendingInvite = sessionStorage.getItem("pendingInvite");
          if (pendingInvite) {
            sessionStorage.removeItem("pendingInvite");
            router.push(`/invite/${pendingInvite}`);
          } else {
            // Successfully signed in, redirect to dashboard
            router.push("/dashboard");
          }
        }
      } else {
        // Handle login using NextAuth

        if (!email.trim() || !password) {
          setError("Please enter both email and password");
          setIsLoading(false);
          return;
        }

        const result = await signIn("credentials", {
          email: email.trim(),
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("Invalid email or password");
        } else if (result?.ok) {
          // Check for pending invite
          const pendingInvite = sessionStorage.getItem("pendingInvite");
          if (pendingInvite) {
            sessionStorage.removeItem("pendingInvite");
            router.push(`/invite/${pendingInvite}`);
          } else {
            // Successfully signed in, redirect to dashboard
            router.push("/dashboard");
          }
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      if (error instanceof Error && "response" in error) {
        const axiosError = error as {
          response?: { data?: { error?: string } };
        };
        if (axiosError.response?.data?.error) {
          setError(axiosError.response.data.error);
        } else {
          setError(
            isSigningUp
              ? "Registration failed. Please try again."
              : "Sign in failed. Please try again."
          );
        }
      } else {
        setError(
          isSigningUp
            ? "Registration failed. Please try again."
            : "Sign in failed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setError("Google sign-in failed");
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      console.error(error);
      setError("Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleToggleMode = () => {
    setMode(isSigningUp ? "login" : "signup");
    setError("");
    setShowPassword(false);
    // Clear form data when switching modes
    setFormData({
      username: "",
      email: "",
      password: "",
    });
  };
  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <Image
              src="/logo-light-nobg.png"
              alt="Collab Logo"
              width={200}
              height={100}
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isSigningUp ? "Join Our Community" : "Let's Start Learning"}
          </h1>
          <p className="text-muted-foreground">
            {isSigningUp
              ? "Create your account to get started"
              : "Please login or sign up to continue"}
          </p>
        </div>

        <Card className="shadow-xl border py-4">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSigningUp && (
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium text-foreground"
                  >
                    Username
                  </Label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Choose a username"
                      className="pl-10 h-12 border-input focus:border-primary focus:ring-ring"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Your Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="pl-10 h-12 border-input focus:border-primary focus:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Your Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-12 border-input focus:border-primary focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute cursor-pointer right-3 top-4 h-4 w-4 text-muted-foreground hover:text-foreground focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/15 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-base"
              >
                {isLoading
                  ? isSigningUp
                    ? "Creating account..."
                    : "Signing in..."
                  : isSigningUp
                  ? "Create Account"
                  : "Sign In"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">
                    or
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="col-span-1 h-12 border-input hover:bg-accent text-foreground font-medium rounded-lg text-base"
                >
                  <Image
                    src="/google.svg"
                    alt="Google Logo"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  Sign in with Google
                </Button>
              </div>
            </form>
            <p className="text-center text-sm text-muted-foreground w-full mt-4">
              {isSigningUp
                ? "Already have an account?"
                : "Don't have an account?"}
              <button
                type="button"
                onClick={handleToggleMode}
                className="font-medium text-primary hover:text-primary/90 underline ml-1"
              >
                {isSigningUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
