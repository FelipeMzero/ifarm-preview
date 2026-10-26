import { Hono } from "hono";
import { healthManagementTypeSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { createHealthManagementType } from "./handler";

export const createHealthManagementTypeRoute = new Hono();

createHealthManagementTypeRoute.post("/", async (c) => {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tipos-sanitarios"],
  );
  if (response) return response;

  try {
    const validation = healthManagementTypeSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createHealthManagementType(validation.data);
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});
