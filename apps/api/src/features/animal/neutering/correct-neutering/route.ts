import { Hono } from "hono";
import { neuteringCorrectionSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../../http";
import { requireSession } from "../../../../session";
import { correctNeutering } from "./handler";

export const correctNeuteringRoute = new Hono();

correctNeuteringRoute.patch(
  `/${uuidParam("id")}/neuterings/:neuteringId`,
  async (c) => {
    const { response } = await requireSession(RESOURCE_ACCESS.animais);
    if (response) return response;

    try {
      const { id, neuteringId } = c.req.param();
      const validation = neuteringCorrectionSchema.safeParse(
        await c.req.json(),
      );
      if (!validation.success) return validationErrorResponse(validation.error);

      await correctNeutering(id, neuteringId, validation.data);
      return c.json({ success: true });
    } catch (error) {
      return errorResponse(error);
    }
  },
);
