import { Hono } from "hono";
import {
  createHealthManagementType,
  deleteHealthManagementType,
  toggleHealthManagementTypeStatus,
  updateHealthManagementType,
} from "@ifarm/domain/health-management-type/mutations";
import { listHealthManagementTypes } from "@ifarm/domain/health-management-type/queries";
import { healthManagementTypeSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../http";
import { requireSession } from "../session";

export const healthManagementTypeRoutes = new Hono();

healthManagementTypeRoutes.get("/", async (c) => {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tipos-sanitarios"],
  );
  if (response) return response;

  try {
    return c.json({ data: await listHealthManagementTypes() });
  } catch (error) {
    return errorResponse(error);
  }
});

healthManagementTypeRoutes.post("/", async (c) => {
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

healthManagementTypeRoutes.put("/:id", async (c) => {
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

healthManagementTypeRoutes.delete("/:id", async (c) => {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tipos-sanitarios"],
  );
  if (response) return response;

  try {
    const { id } = c.req.param();
    await deleteHealthManagementType(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

// Ativa ou desativa o tipo de manejo sanitário.
healthManagementTypeRoutes.patch("/:id", async (c) => {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tipos-sanitarios"],
  );
  if (response) return response;

  try {
    const { id } = c.req.param();
    const data = await toggleHealthManagementTypeStatus(id);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});
