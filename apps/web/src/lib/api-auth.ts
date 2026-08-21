import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "./auth";

type RequireSessionOptions = {
  forbiddenRoles?: readonly string[];
};

export async function requireSession(options?: RequireSessionOptions) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 },
      ),
    };
  }

  if (options?.forbiddenRoles?.includes(session.user.role ?? "")) {
    return {
      session,
      response: NextResponse.json(
        { message: "Acesso negado." },
        { status: 403 },
      ),
    };
  }

  return { session, response: null };
}
