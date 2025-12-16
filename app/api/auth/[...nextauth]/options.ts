import CredentialsProvider from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import dbConnect from "@/lib/db";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import type { User as NextAuthUser, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Account } from "next-auth";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(
        credentials: Partial<Record<"email" | "password", unknown>>
      ) {
        try {
          await dbConnect();
          console.log("Database connected successfully");

          if (!credentials?.email || !credentials?.password) {
            console.log("Missing credentials");
            throw new Error("Email and password are required");
          }

          const email = String(credentials.email).toLowerCase().trim();
          const password = String(credentials.password);

          console.log("Attempting login for email:", email);

          const user = (await User.findOne({
            email: email,
          }).lean()) as {
            _id: { toString: () => string };
            email: string;
            username?: string;
            name?: string;
            password: string;
            isVerified?: boolean;
            avatar?: string;
          } | null;

          // user not found
          if (!user) {
            console.log("User not found for email:", email);
            throw new Error("User not found");
          }

          // Check if user has a password (not OAuth-only user)
          if (!user.password) {
            console.log("User has no password (OAuth account)");
            throw new Error("Please sign in with Google");
          }

          console.log("Comparing passwords...");
          const isPasswordValid = await bcrypt.compare(password, user.password);

          console.log("Password valid:", isPasswordValid);

          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          console.log("Login successful for user:", user.email);

          return {
            id: user._id.toString(),
            _id: user._id.toString(),
            email: user.email,
            username: user.username || "",
            name: user.name || user.username || "",
            image: user.avatar,
            isVerified: user.isVerified ?? true,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({
      token,
      user,
      trigger,
      session,
    }: {
      token: JWT;
      user: NextAuthUser;
      trigger?: "signIn" | "signUp" | "update";
      session?: { user?: { name?: string; image?: string; username?: string } };
    }) {
      if (user) {
        token._id = user._id || user.id;
        token.username = user.username || user.email?.split("@")[0];
        token.isVerified = user.isVerified ?? true;
        token.picture = user.image;
      }

      if (trigger === "update" && session?.user) {
        if (session.user.name) token.name = session.user.name;
        if (session.user.image) token.picture = session.user.image;
        if (session.user.username) token.username = session.user.username;
        // Add other fields if necessary
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session?.user && token) {
        session.user._id = token._id as string;
        session.user.username = token.username as string;
        session.user.isVerified = token.isVerified as boolean;
        session.user.image = token.picture as string;
      }
      return session;
    },
    async signIn({
      user,
      account,
    }: {
      user: NextAuthUser;
      account?: Account | null;
    }) {
      try {
        // Allow all credential logins (handled by authorize function)
        if (account?.provider === "credentials") {
          return true;
        }

        // Handle Google OAuth sign-in
        if (account?.provider === "google") {
          await dbConnect();

          // Check if user already exists with this email
          const existingUser = await User.findOne({ email: user.email });

          if (existingUser) {
            // User exists, update their info if needed
            if (!existingUser.googleId) {
              existingUser.googleId = account.providerAccountId;
              await existingUser.save();
            }
            // Update user object with existing user data
            user.id = existingUser._id.toString();
            user._id = existingUser._id.toString();
            user.username = existingUser.username;
            user.isVerified = existingUser.isVerified;
            return true;
          } else {
            // Generate unique username from email
            let username = user.email?.split("@")[0].toLowerCase() || "user";

            // Check if username exists and make it unique
            const usernameExists = await User.findOne({ username });
            if (usernameExists) {
              username = `${username}${Math.floor(Math.random() * 10000)}`;
            }

            // Create new user for Google sign-in
            const newUser = await User.create({
              email: user.email,
              name: user.name || username,
              username: username,
              avatar: user.image,
              googleId: account.providerAccountId,
              isVerified: true,
            });

            // Update user object with new user data
            user.id = newUser._id.toString();
            user._id = newUser._id.toString();
            user.username = newUser.username;
            user.isVerified = newUser.isVerified;
            return true;
          }
        }

        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        // Return true to avoid blocking the sign-in, but log the error
        return true;
      }
    },
  },
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
