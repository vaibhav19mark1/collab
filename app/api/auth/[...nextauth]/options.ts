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
            throw new Error("Email and password are required");
          }

          const user = (await User.findOne({
            $or: [
              {
                email: credentials?.email,
              },
            ],
          }).lean()) as {
            _id: { toString: () => string };
            email: string;
            username?: string;
            name?: string;
            password: string;
            isVerified?: boolean;
          } | null;

          // user not found
          if (!user) throw new Error("User not found");
          // user not verified
          // if (!user.verified)
          //   throw new Error("Please verify your email to login");

          const isPasswordValid = await bcrypt.compare(
            credentials?.password as string,
            user.password
          );
          if (!isPasswordValid) throw new Error("Invalid password");

          return {
            id: user._id.toString(),
            _id: user._id.toString(),
            email: user.email,
            username: user.username || "",
            name: user.name || user.username || "",
            isVerified: user.isVerified ?? true,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
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
    async jwt({ token, user }: { token: JWT; user: NextAuthUser }) {
      if (user) {
        token._id = user._id || user.id;
        token.username = user.username || user.email?.split("@")[0];
        token.isVerified = user.isVerified ?? true;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session?.user && token) {
        session.user._id = token._id as string;
        session.user.username = token.username as string;
        session.user.isVerified = token.isVerified as boolean;
      }
      return session;
    },
    async signIn({ user, account }: { user: NextAuthUser; account?: Account | null }) {
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
