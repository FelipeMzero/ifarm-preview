import { Hono } from "hono";
import { errorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { listPropertyOptions } from "./handler";

export const listPropertyOptionsRoute = new Hono();

// Lista enxuta de propriedades para o seletor de "propriedade atual" (troca de contexto).
// Sem restrição de papel: mesmo quem não pode gerenciar propriedades precisa escolher
// em qual está trabalhando.
listPropertyOptionsRoute.get("/options", async (c) => {
  const { response } = await requireSession();
  if (response) return response;

  try {
    return c.json({ data: await listPropertyOptions() });
  } catch (error) {
    return errorResponse(error);
  }
});
