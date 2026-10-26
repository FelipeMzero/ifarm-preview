import { Hono } from "hono";
import { commitmentsLookupSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { listCommitments } from "./handler";

export const lookupCommitmentsRoute = new Hono();

// Compromissos em aberto de vários animais de uma vez (POST porque a lista não cabe
// numa URL), para o seletor marcar os indisponíveis.
lookupCommitmentsRoute.post("/commitments", async (c) => {
  // Mesma permissão da listagem de animais que alimenta o seletor.
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const validation = commitmentsLookupSchema.safeParse(
      await c.req.json().catch(() => ({})),
    );
    if (!validation.success) {
      return c.json({ message: "Parâmetros inválidos." }, 400);
    }

    const { animalIds, ...exclude } = validation.data;
    return c.json(await listCommitments(animalIds, exclude));
  } catch (error) {
    return errorResponse(error);
  }
});
