import { Hono } from "hono";
import { errorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { getCurrentPropertyDetails } from "./handler";

export const getCurrentPropertyDetailsRoute = new Hono();

// Detalhes da propriedade atualmente selecionada, para exibição no painel. Sem
// restrição de papel: qualquer usuário logado precisa ver em qual propriedade está.
getCurrentPropertyDetailsRoute.get("/current-property/details", async (c) => {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const data = await getCurrentPropertyDetails(session.user.id);
    return c.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
});
