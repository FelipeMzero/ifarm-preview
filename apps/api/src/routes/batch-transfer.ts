import { Hono } from "hono";
import {
  cancelBatchTransfer,
  confirmBatchTransfer,
  createBatchTransfer,
  updateBatchTransfer,
} from "@ifarm/domain/batch-transfer/mutations";
import {
  getBatchTransfer,
  listBatchTransfers,
} from "@ifarm/domain/batch-transfer/queries";
import {
  batchTransferQuerySchema,
  batchTransferSchema,
  RESOURCE_ACCESS,
} from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../http";
import { requireSession } from "../session";

export const batchTransferRoutes = new Hono();

batchTransferRoutes.get("/", async (c) => {
  const { response, session } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { searchParams } = new URL(c.req.url);
    const query = batchTransferQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!query.success) {
      return c.json({ message: "Parâmetros inválidos." }, 400);
    }

    return c.json(await listBatchTransfers(query.data, session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
});

batchTransferRoutes.post("/", async (c) => {
  const { response, session } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const validation = batchTransferSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createBatchTransfer(validation.data, session.user.id);
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});

batchTransferRoutes.get("/:id", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getBatchTransfer(id));
  } catch (error) {
    return errorResponse(error);
  }
});

batchTransferRoutes.put("/:id", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = batchTransferSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    await updateBatchTransfer(id, validation.data);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

// Cancela um plano pendente (o registro é mantido para auditoria).
batchTransferRoutes.post("/:id/cancel", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await cancelBatchTransfer(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

// Efetiva o plano: os animais passam para o lote de destino.
batchTransferRoutes.post("/:id/confirm", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await confirmBatchTransfer(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
