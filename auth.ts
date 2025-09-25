import NextAuth from "next-auth";
import { authOptions } from "./app/api/auth/[...nextauth]/options";

// Export the NextAuth configuration for server-side usage
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
