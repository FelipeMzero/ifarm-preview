import { Hono } from "hono";
import { batchQuerySchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { listBatches } from "./handler";

export const listBatchesRoute = new Hono();

listBatchesRoute.get("/", async (c) => {
  const { response, session } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { searchParams } = new URL(c.req.url);
    const query = batchQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!query.success) {
      return c.json({ message: "Parâmetros inválidos." }, 400);
    }

    return c.json(await listBatches(query.data, session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
});
