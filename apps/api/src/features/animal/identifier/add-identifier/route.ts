import { Hono } from "hono";
import { identifierChangeSchemaFor, RESOURCE_ACCESS } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../../http";
import { requireSession } from "../../../../session";
import { CommitmentError } from "../../commitments";
import { isIdentifierKind } from "../shared";
import { addIdentifier } from "./handler";

export const addIdentifierRoute = new Hono();

// Troca (ou remove, com value vazio) o identificador na hora.
addIdentifierRoute.post(`/${uuidParam("id")}/identifiers/:kind`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id, kind } = c.req.param();
    if (!isIdentifierKind(kind)) {
      return Response.json({ message: "Não encontrado." }, { status: 404 });
    }

    const validation = identifierChangeSchemaFor(kind).safeParse(
      await c.req.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    await addIdentifier(kind, id, validation.data);
    return c.json({ success: true }, 201);
  } catch (error) {
    // Conflito de compromisso aparece só como mensagem, sem campo do formulário.
    return errorResponse(
      error,
      error instanceof CommitmentError ? { field: null } : {},
    );
  }
});
