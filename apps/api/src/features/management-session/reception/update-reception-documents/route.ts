import { Hono } from "hono";
import { receptionDocumentsSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../../http";
import { requireSession } from "../../../../session";
import { updateReceptionDocuments } from "./handler";

export const updateReceptionDocumentsRoute = new Hono();

// Documentos da carga (GTA e nota fiscal) de uma recepção em aberto.
updateReceptionDocumentsRoute.patch(
  `/${uuidParam("id")}/reception`,
  async (c) => {
    const { response } = await requireSession(RESOURCE_ACCESS.recepcoes);
    if (response) return response;

    try {
      const { id } = c.req.param();
      const validation = receptionDocumentsSchema.safeParse(
        await c.req.json().catch(() => ({})),
      );
      if (!validation.success) return validationErrorResponse(validation.error);

      await updateReceptionDocuments(id, validation.data);
      return c.json({ success: true });
    } catch (error) {
      return errorResponse(error);
    }
  },
);
