import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { cancelManagementSession } from "./handler";

export const cancelManagementSessionRoute = new Hono();

// Cancela a sessão (os registros ficam gravados, mas não passam a valer).
cancelManagementSessionRoute.post(`/${uuidParam("id")}/cancel`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await cancelManagementSession(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
