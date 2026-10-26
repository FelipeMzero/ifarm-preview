import { Hono } from "hono";
import { createReceptionSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../http";
import { requireSession } from "../../../session";
import { createReception } from "./handler";

export const createReceptionRoute = new Hono();

// "Receber animais": abre uma recepção (viagem) da compra.
createReceptionRoute.post(
  `/purchases/${uuidParam("id")}/receptions`,
  async (c) => {
    const { response } = await requireSession(RESOURCE_ACCESS.recepcoes);
    if (response) return response;

    try {
      const { id } = c.req.param();
      const validation = createReceptionSchema.safeParse(
        await c.req.json().catch(() => ({})),
      );
      if (!validation.success) return validationErrorResponse(validation.error);

      const data = await createReception(id, validation.data);
      return c.json({ success: true, data }, 201);
    } catch (error) {
      return errorResponse(error);
    }
  },
);
