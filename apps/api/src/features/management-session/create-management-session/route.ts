import { Hono } from "hono";
import { managementSessionSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { createManagementSession } from "./handler";

export const createManagementSessionRoute = new Hono();

createManagementSessionRoute.post("/", async (c) => {
  const { response, session } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const validation = managementSessionSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createManagementSession(
      validation.data,
      session.user.id,
    );
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});
