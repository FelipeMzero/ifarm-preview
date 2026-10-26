import { Hono } from "hono";
import { managementSessionQuerySchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { listManagementSessions } from "./handler";

export const listManagementSessionsRoute = new Hono();

listManagementSessionsRoute.get("/", async (c) => {
  const { response, session } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { searchParams } = new URL(c.req.url);
    const query = managementSessionQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!query.success) {
      return c.json({ message: "Parâmetros inválidos." }, 400);
    }

    return c.json(await listManagementSessions(query.data, session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
});
