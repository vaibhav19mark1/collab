import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
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
        } catch (error: any) {
          throw new Error(error);
        }
      },
    }),
  ],
};
