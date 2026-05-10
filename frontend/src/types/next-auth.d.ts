import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: {
      id: number;
      role: string;
      fullName: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: number;
    role: string;
    fullName: string;
    accessToken: string;
    refreshToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    role: string;
    fullName: string;
    accessToken: string;
    refreshToken: string;
  }
}
