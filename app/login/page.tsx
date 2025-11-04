"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "signup") {
        // Validate signup fields
        if (!formData.username.trim()) {
          setError("Username is required");
          setIsLoading(false);
          return;
        }
        if (formData.username.length < 2) {
          setError("Username must be at least 2 characters");
          setIsLoading(false);
          return;
        }
        if (!formData.email.trim()) {
          setError("Email is required");
          setIsLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          setIsLoading(false);
          return;
        }

        // Handle signup via custom registration endpoint
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.username.trim(),
            email: formData.email.trim(),
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Registration failed");
          return;
        }

        // After successful registration, automatically sign in using NextAuth
        const signInResult = await signIn("credentials", {
          email: formData.email.trim(),
          password: formData.password,
          redirect: false,
        });

        if (signInResult?.error) {
          setError(
            "Registration successful, but automatic sign in failed. Please try logging in manually."
          );
        } else if (signInResult?.ok) {
          // Successfully signed in, redirect to dashboard
          router.push("/dashboard");
        }
      } else {
        // Handle login using NextAuth
        const { email, password } = formData;
        
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
          // Successfully signed in, redirect to dashboard
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setError(mode === "signup" ? "Registration failed. Please try again." : "Sign in failed. Please try again.");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500 rounded-full mb-4">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {mode === "signup" ? "Join Our Community" : "Let's Start Learning"}
          </h1>
          <p className="text-gray-600">
            {mode === "signup"
              ? "Create your account to get started"
              : "Please login or sign up to continue"}
          </p>
        </div>

        {/* Sign Up/Login Form */}
        <Card className="shadow-xl border-0">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username - Only show for signup */}
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium text-gray-700"
                  >
                    Username
                  </Label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-4 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Choose a username"
                      className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Your Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-4 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Your Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-4 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-4 h-4 w-4 text-gray-400 hover:text-gray-600 focus:outline-none"
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

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg text-base"
              >
                {isLoading
                  ? mode === "signup"
                    ? "Creating account..."
                    : "Signing in..."
                  : mode === "signup"
                  ? "Create Account"
                  : "Sign In"}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign In */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="col-span-1 h-12 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-base"
                >
                  <Image
                    src="/google.svg"
                    alt="Google Logo"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="col-span-1 h-12 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-base"
                >
                  <Image
                    src="/github.svg"
                    alt="GitHub Logo"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  GitHub
                </Button>
              </div>
            </form>
            <p className="text-center text-sm text-gray-600 w-full mt-6">
              {mode === "signup"
                ? "Already have an account?"
                : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signup" ? "login" : "signup");
                  setError("");
                  setShowPassword(false);
                  // Clear form data when switching modes
                  setFormData({
                    username: "",
                    email: "",
                    password: "",
                  });
                }}
                className="font-medium text-orange-600 hover:text-orange-500 underline"
              >
                {mode === "signup" ? "Sign in" : "Sign up"}
              </button>
            </p>
          </CardContent>
          {/* <CardFooter className="px-8 pb-8"></CardFooter> */}
        </Card>
      </div>
    </div>
  );
}
