import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    _id?: string;
    username?: string;
    email?: string;
    role?: string;
    isVerified?: boolean;
  }

  interface Session extends DefaultSession {
    user: {
      _id: string;
      username?: string;
      email?: string;
      role?: string;
      isVerified?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    _id?: string;
    username?: string;
    isVerified?: boolean;
  }
}
