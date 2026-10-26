import { Hono } from "hono";
import { batchTransferQuerySchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { listBatchTransfers } from "./handler";

export const listBatchTransfersRoute = new Hono();

listBatchTransfersRoute.get("/", async (c) => {
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
