import { Hono } from "hono";
import { healthManagementTypeSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../http";
import { requireSession } from "../../../session";
import { updateHealthManagementType } from "./handler";

export const updateHealthManagementTypeRoute = new Hono();

updateHealthManagementTypeRoute.put(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tipos-sanitarios"],
  );
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = healthManagementTypeSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await updateHealthManagementType(id, validation.data);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});
