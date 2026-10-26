import { Hono } from "hono";
import { animalUpdateSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../http";
import { requireSession } from "../../../session";
import { updateAnimal } from "./handler";

export const updateAnimalRoute = new Hono();

updateAnimalRoute.put(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = animalUpdateSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    await updateAnimal(id, validation.data);
    return c.json({ success: true });
  } catch (error) {
    // Conflito de compromisso aparece só como mensagem, sem campo do formulário.
    return errorResponse(error, { field: null });
  }
});
