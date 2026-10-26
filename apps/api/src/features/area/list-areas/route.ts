import { Hono } from "hono";
import { areaQuerySchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { listAreas } from "./handler";

export const listAreasRoute = new Hono();

listAreasRoute.get("/", async (c) => {
  const { session, response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const { searchParams } = new URL(c.req.url);
    const validation = areaQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await listAreas(validation.data, session.user.id);
    return c.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
});
