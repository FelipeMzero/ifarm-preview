import { Hono } from "hono";
import { RESOURCE_ACCESS, weighingCreateSchema } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../../http";
import { requireSession } from "../../../../session";
import { addWeighing } from "./handler";

export const addWeighingRoute = new Hono();

// Registra uma pesagem avulsa na hora (o peso atual passa a ser o da mais recente).
addWeighingRoute.post(`/${uuidParam("id")}/weighings`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = weighingCreateSchema.safeParse(
      await c.req.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    await addWeighing(id, validation.data);
    return c.json({ success: true }, 201);
  } catch (error) {
    // Conflito de compromisso aparece só como mensagem, sem campo do formulário.
    return errorResponse(error, { field: null });
  }
});
