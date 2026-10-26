import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { getManagementOptions } from "./handler";

export const getManagementOptionsRoute = new Hono();

// Opções do planejamento e do registro (tipos sanitários, técnicas, pessoas, lotes).
getManagementOptionsRoute.get("/options", async (c) => {
  const { response, session } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    return c.json(
      await getManagementOptions(
        new URL(c.req.url).searchParams.get("propertyId"),
        session.user.id,
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
});
