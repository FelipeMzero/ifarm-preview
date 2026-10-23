import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { roles } from "@ifarm/shared";

export const authClient = createAuthClient({
  plugins: [adminClient({ roles })],
});
export const { signIn, signOut, useSession } = authClient;
