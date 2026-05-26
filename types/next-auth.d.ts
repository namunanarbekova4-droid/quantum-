import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
      onboarded?: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
