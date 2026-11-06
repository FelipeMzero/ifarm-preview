import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { roles } from "@ifarm/shared";

const baseURL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const authClient = createAuthClient({
  baseURL: baseURL ? `${baseURL}/api/auth` : undefined,
  plugins: [adminClient({ roles })],
});
export const { signIn, signOut, useSession } = authClient;
