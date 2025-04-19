import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Extending the built-in session types
   */
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
    }
  }

  /**
   * Extending the built-in user types
   */
  interface User {
    role?: string;
  }
}