import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../../http";
import { requireSession } from "../../../../session";
import { getSessionAnimal } from "./handler";

export const getSessionAnimalRoute = new Hono();

// Tudo o que as telas de etapa precisam de um animal da sessão.
getSessionAnimalRoute.get(
  `/${uuidParam("id")}/animals/${uuidParam("animalId")}`,
  async (c) => {
    const { response } = await requireSession(RESOURCE_ACCESS.manejos);
    if (response) return response;

    try {
      const { id, animalId } = c.req.param();
      return c.json(await getSessionAnimal(id, animalId));
    } catch (error) {
      return errorResponse(error);
    }
  },
);
