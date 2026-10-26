import { Hono } from "hono";
import { receiveAnimalSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../../http";
import { requireSession } from "../../../../session";
import { receiveSessionAnimal } from "./handler";

export const receiveSessionAnimalRoute = new Hono();

// Recebe um animal que desceu do caminhão (cria o animal e o inclui na sessão).
receiveSessionAnimalRoute.post(
  `/${uuidParam("id")}/reception/animals`,
  async (c) => {
    const { response } = await requireSession(RESOURCE_ACCESS.manejos);
    if (response) return response;

    try {
      const { id } = c.req.param();
      const validation = receiveAnimalSchema.safeParse(
        await c.req.json().catch(() => ({})),
      );
      if (!validation.success) return validationErrorResponse(validation.error);

      const data = await receiveSessionAnimal(id, validation.data);
      return c.json({ success: true, data }, 201);
    } catch (error) {
      return errorResponse(error);
    }
  },
);
