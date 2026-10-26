import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../../http";
import { requireSession } from "../../../../session";
import { isIdentifierKind } from "../shared";
import { listIdentifiers } from "./handler";

export const listIdentifiersRoute = new Hono();

// Histórico válido (não excluído) de brincos ou RFIDs do animal, do mais recente
// para o mais antigo.
listIdentifiersRoute.get(`/${uuidParam("id")}/identifiers/:kind`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id, kind } = c.req.param();
    if (!isIdentifierKind(kind)) {
      return Response.json({ message: "Não encontrado." }, { status: 404 });
    }
    return c.json(await listIdentifiers(kind, id));
  } catch (error) {
    return errorResponse(error);
  }
});
