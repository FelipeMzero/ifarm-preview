import { Hono } from "hono";
import { propertyQuerySchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { listProperties } from "./handler";

export const listPropertiesRoute = new Hono();

listPropertiesRoute.get("/", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.propriedades);
  if (response) return response;

  try {
    const { searchParams } = new URL(c.req.url);
    const validation = propertyQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!validation.success) {
      return c.json({ message: "Parâmetros inválidos." }, 400);
    }

    return c.json(await listProperties(validation.data));
  } catch (error) {
    return errorResponse(error);
  }
});
