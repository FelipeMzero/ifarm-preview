import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { confirmManagementSession } from "./handler";

export const confirmManagementSessionRoute = new Hono();

// Consolida a sessão: os registros passam a valer.
confirmManagementSessionRoute.post(`/${uuidParam("id")}/confirm`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const data = await confirmManagementSession(id);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});
