import { Hono } from "hono";
import { identifierCorrectionSchemaFor, RESOURCE_ACCESS } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../../http";
import { requireSession } from "../../../../session";
import { isIdentifierKind } from "../shared";
import { correctIdentifier } from "./handler";

export const correctIdentifierRoute = new Hono();

// Corrige valor, data (só registros avulsos) e observação de um brinco/RFID.
correctIdentifierRoute.patch(
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

      const validation = identifierCorrectionSchemaFor(kind).safeParse(
        await c.req.json().catch(() => ({})),
      );
      if (!validation.success) return validationErrorResponse(validation.error);

      await correctIdentifier(kind, id, recordId, validation.data);
      return c.json({ success: true });
    } catch (error) {
      return errorResponse(error);
    }
  },
);
