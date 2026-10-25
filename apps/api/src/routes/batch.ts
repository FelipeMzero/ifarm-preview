import { Hono } from "hono";
import {
  closeBatch,
  createBatch,
  deleteBatch,
  reopenBatch,
  updateBatch,
} from "@ifarm/domain/batch/mutations";
import {
  getBatch,
  getBatchDetails,
  listBatches,
} from "@ifarm/domain/batch/queries";
import {
  batchCreateSchema,
  batchQuerySchema,
  batchReopenSchema,
  batchUpdateSchema,
  RESOURCE_ACCESS,
} from "@ifarm/shared";
import { errorResponse, uuidParam, validationErrorResponse } from "../http";
import { requireSession } from "../session";

export const batchRoutes = new Hono();

batchRoutes.get("/", async (c) => {
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

batchRoutes.post("/", async (c) => {
  const { response, session } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const validation = batchCreateSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createBatch(validation.data, session.user.id);
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});

batchRoutes.get(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getBatch(id));
  } catch (error) {
    return errorResponse(error);
  }
});

batchRoutes.put(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = batchUpdateSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    await updateBatch(id, validation.data);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

batchRoutes.delete(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await deleteBatch(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

// Encerra um lote vazio e libera a área que ele ocupava.
batchRoutes.post(`/${uuidParam("id")}/close`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await closeBatch(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

// Painel do lote (animais, indicadores, movimentações, transferências e compras).
batchRoutes.get(`/${uuidParam("id")}/details`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getBatchDetails(id));
  } catch (error) {
    return errorResponse(error);
  }
});

// Reativa um lote encerrado numa área livre.
batchRoutes.post(`/${uuidParam("id")}/reopen`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = batchReopenSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    await reopenBatch(id, validation.data);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
