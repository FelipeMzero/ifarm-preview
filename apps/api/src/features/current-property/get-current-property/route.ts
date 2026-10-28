import { Hono } from "hono";
import { errorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { getOrAssignCurrentProperty } from "../resolve.public";

export const getCurrentPropertyRoute = new Hono();

// Retorna a propriedade atualmente selecionada pelo usuário logado. Se ele ainda não
// tiver escolhido nenhuma, assume automaticamente a mais antiga cadastrada (ou `null`
// se não houver nenhuma propriedade no sistema).
getCurrentPropertyRoute.get("/current-property", async (c) => {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const data = await getOrAssignCurrentProperty(session.user.id);
    return c.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
});
