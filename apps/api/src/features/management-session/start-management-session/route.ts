import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { startManagementSession } from "./handler";

export const startManagementSessionRoute = new Hono();

// Inicia o registro (o início é a hora do sistema).
startManagementSessionRoute.post(`/${uuidParam("id")}/start`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await startManagementSession(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
