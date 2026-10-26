import { Hono } from "hono";
import { managementSessionStartSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../http";
import { requireSession } from "../../../session";
import { startManagementSession } from "./handler";

export const startManagementSessionRoute = new Hono();

// Inicia o registro (ou corrige a data do manejo enquanto não consolidada).
startManagementSessionRoute.post(`/${uuidParam("id")}/start`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = managementSessionStartSchema.safeParse(
      await c.req.json(),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    await startManagementSession(id, validation.data);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
