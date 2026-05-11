import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      oid?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userAssertion?: string;
    refreshToken?: string;
    idToken?: string;
    oid?: string;
    expiresAt?: number;
  }
}
