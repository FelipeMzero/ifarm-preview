import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../../http";
import { requireSession } from "../../../../session";
import { clearSessionAnimalStep } from "./handler";

export const clearSessionAnimalStepRoute = new Hono();

// Desfaz o registro da etapa no animal e devolve o contexto atualizado.
clearSessionAnimalStepRoute.delete(
  `/${uuidParam("id")}/animals/${uuidParam("animalId")}/steps/:key`,
  async (c) => {
    const { response } = await requireSession(RESOURCE_ACCESS.manejos);
    if (response) return response;

    try {
      const { id, animalId, key } = c.req.param();
      const data = await clearSessionAnimalStep(
        id,
        animalId,
        decodeURIComponent(key),
      );
      return c.json({ success: true, data });
    } catch (error) {
      return errorResponse(error);
    }
  },
);
