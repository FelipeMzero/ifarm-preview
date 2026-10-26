import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../../http";
import { requireSession } from "../../../../session";
import { cancelWeighing } from "./handler";

export const cancelWeighingRoute = new Hono();

cancelWeighingRoute.delete(
  `/${uuidParam("id")}/weighings/:weighingId`,
  async (c) => {
    const { response } = await requireSession(RESOURCE_ACCESS.animais);
    if (response) return response;

    try {
      const { id, weighingId } = c.req.param();
      await cancelWeighing(id, weighingId);
      return c.json({ success: true });
    } catch (error) {
      return errorResponse(error);
    }
  },
);
