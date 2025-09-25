import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import Google from "next-auth/providers/google";

const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "Creadentials",
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
      },
      async authorize(credentials: any): Promise<any> {
        await dbConnect();
        try {
          const user = await User.findOne({
            $or: [
              {
                email: credentials?.identifier,
              },
              {
                username: credentials?.identifier,
              },
            ],
          });
          // user not found
          if (!user) throw new Error("User not found");
          // user not verified
          if (!user.verified)
            throw new Error("Please verify your email to login");

          const isPasswordValid = await bcrypt.compare(
            credentials?.password,
            user.password
          );
          if (!isPasswordValid) throw new Error("Invalid password");
          return user;
        } catch (error: any) {
          throw new Error(error);
        }
      },
    }),
    Google,
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token._id = user._id?.toString();
        token.username = user.username;
        token.isVerified = user.isVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user._id = token._id as string;
        session.user.username = token.username as string;
        session.user.isVerified = token.isVerified as boolean;
      }
      return session;
    },
  },
};

export { authOptions };
