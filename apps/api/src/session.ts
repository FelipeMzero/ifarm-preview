import { getContext } from "hono/context-storage";
import { auth } from "./auth";

type RequireSessionOptions = {
  forbiddenRoles?: readonly string[];
};

// Lê a sessão da requisição atual (o contexto vem do middleware contextStorage, em index.ts).
export async function requireSession(options?: RequireSessionOptions) {
  const session = await auth.api.getSession({
    headers: getContext().req.raw.headers,
  });

  if (!session) {
    return {
      session: null,
      response: Response.json({ message: "Não autenticado." }, { status: 401 }),
    };
  }

  if (options?.forbiddenRoles?.includes(session.user.role ?? "")) {
    return {
      session,
      response: Response.json({ message: "Acesso negado." }, { status: 403 }),
    };
  }

  return { session, response: null };
}
