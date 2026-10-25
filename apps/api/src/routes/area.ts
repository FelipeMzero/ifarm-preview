import { Hono } from "hono";
import {
  createArea,
  deleteArea,
  toggleAreaStatus,
  updateArea,
} from "@ifarm/domain/area/mutations";
import {
  getArea,
  getAreaOccupancyHistory,
  listAreas,
} from "@ifarm/domain/area/queries";
import { areaQuerySchema, areaSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam, validationErrorResponse } from "../http";
import { requireSession } from "../session";

export const areaRoutes = new Hono();

areaRoutes.get("/", async (c) => {
  const { session, response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const { searchParams } = new URL(c.req.url);
    const validation = areaQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await listAreas(validation.data, session.user.id);
    return c.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
});

areaRoutes.post("/", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const validation = areaSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createArea(validation.data);
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});

areaRoutes.get(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getArea(id));
  } catch (error) {
    return errorResponse(error);
  }
});

areaRoutes.put(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = areaSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await updateArea(id, validation.data);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});

areaRoutes.delete(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await deleteArea(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

// Ativa ou desativa a área (recusa desativar área ocupada por lote).
areaRoutes.patch(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const data = await toggleAreaStatus(id);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});

// Lotes que ocuparam a área, do mais recente para o mais antigo.
areaRoutes.get(`/${uuidParam("id")}/history`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json({ data: await getAreaOccupancyHistory(id) });
  } catch (error) {
    return errorResponse(error);
  }
});
