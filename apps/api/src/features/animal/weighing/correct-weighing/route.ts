import { Hono } from "hono";
import { RESOURCE_ACCESS, weighingCorrectionSchema } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../../http";
import { requireSession } from "../../../../session";
import { correctWeighing } from "./handler";

export const correctWeighingRoute = new Hono();

correctWeighingRoute.patch(
  `/${uuidParam("id")}/weighings/:weighingId`,
  async (c) => {
    const { response } = await requireSession(RESOURCE_ACCESS.animais);
    if (response) return response;

    try {
      const { id, weighingId } = c.req.param();
      const validation = weighingCorrectionSchema.safeParse(await c.req.json());
      if (!validation.success) return validationErrorResponse(validation.error);

      await correctWeighing(id, weighingId, validation.data);
      return c.json({ success: true });
    } catch (error) {
      return errorResponse(error);
    }
  },
);
