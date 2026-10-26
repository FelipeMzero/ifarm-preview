import { Hono } from "hono";
import { neuteringCreateSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../../http";
import { requireSession } from "../../../../session";
import { addNeutering } from "./handler";

export const addNeuteringRoute = new Hono();

// Registra uma castração avulsa na hora (recastração exige o motivo).
addNeuteringRoute.post(`/${uuidParam("id")}/neuterings`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = neuteringCreateSchema.safeParse(
      await c.req.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    await addNeutering(id, validation.data);
    return c.json({ success: true }, 201);
  } catch (error) {
    // Conflito de compromisso aparece só como mensagem, sem campo do formulário.
    return errorResponse(error, { field: null });
  }
});
