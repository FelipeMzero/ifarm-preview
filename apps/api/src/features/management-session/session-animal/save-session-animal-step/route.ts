import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../../http";
import { requireSession } from "../../../../session";
import { saveSessionAnimalStep } from "./handler";

export const saveSessionAnimalStepRoute = new Hono();

// Registra (ou corrige) uma etapa do manejo no animal e devolve o contexto atualizado.
// Os dados são validados pelo módulo da etapa.
saveSessionAnimalStepRoute.put(
  `/${uuidParam("id")}/animals/${uuidParam("animalId")}/steps/:key`,
  async (c) => {
    const { response } = await requireSession(RESOURCE_ACCESS.manejos);
    if (response) return response;

    try {
      const { id, animalId, key } = c.req.param();
      const data = await saveSessionAnimalStep(
        id,
        animalId,
        decodeURIComponent(key),
        await c.req.json(),
      );
      return c.json({ success: true, data });
    } catch (error) {
      return errorResponse(error);
    }
  },
);
