import { Hono } from "hono";
import { managementOptionsQuerySchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { getManagementOptions } from "./handler";

export const getManagementOptionsRoute = new Hono();

// Opções do planejamento e do registro (tipos sanitários, técnicas, pessoas, lotes).
getManagementOptionsRoute.get("/options", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { searchParams } = new URL(c.req.url);
    const query = managementOptionsQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!query.success) {
      return c.json({ message: "Parâmetros inválidos." }, 400);
    }

    return c.json(await getManagementOptions(query.data.propertyId));
  } catch (error) {
    return errorResponse(error);
  }
});
