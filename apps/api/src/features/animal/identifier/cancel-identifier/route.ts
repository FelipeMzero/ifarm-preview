import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../../http";
import { requireSession } from "../../../../session";
import { isIdentifierKind } from "../shared";
import { cancelIdentifier } from "./handler";

export const cancelIdentifierRoute = new Hono();

// Exclusão lógica: o registro sai do histórico e o identificador atual é recalculado.
cancelIdentifierRoute.delete(
  `/${uuidParam("id")}/identifiers/:kind/:recordId`,
  async (c) => {
    const { response } = await requireSession(RESOURCE_ACCESS.animais);
    if (response) return response;

    try {
      const { id, kind, recordId } = c.req.param();
      if (!isIdentifierKind(kind)) {
        return Response.json(
          { success: false, message: "Não encontrado." },
          { status: 404 },
        );
      }

      await cancelIdentifier(kind, id, recordId);
      return c.json({ success: true });
    } catch (error) {
      return errorResponse(error);
    }
  },
);
