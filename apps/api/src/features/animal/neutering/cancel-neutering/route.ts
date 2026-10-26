import { Hono } from "hono";
import { neuteringCancelSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../../http";
import { requireSession } from "../../../../session";
import { cancelNeutering } from "./handler";

export const cancelNeuteringRoute = new Hono();

cancelNeuteringRoute.delete(
  `/${uuidParam("id")}/neuterings/:neuteringId`,
  async (c) => {
    const { response } = await requireSession(RESOURCE_ACCESS.animais);
    if (response) return response;

    try {
      const { id, neuteringId } = c.req.param();
      const validation = neuteringCancelSchema.safeParse(
        await c.req.json().catch(() => ({})),
      );
      if (!validation.success) {
        return c.json(
          { success: false, message: "Parâmetros inválidos." },
          400,
        );
      }

      await cancelNeutering(id, neuteringId, validation.data);
      return c.json({ success: true });
    } catch (error) {
      return errorResponse(error);
    }
  },
);
