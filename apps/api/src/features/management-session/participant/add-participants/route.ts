import { Hono } from "hono";
import { RESOURCE_ACCESS, sessionParticipantsSchema } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../../http";
import { requireSession } from "../../../../session";
import { addParticipants } from "./handler";

export const addParticipantsRoute = new Hono();

// Inclui na sessão animais que não estavam no planejamento.
addParticipantsRoute.post(`/${uuidParam("id")}/participants`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = sessionParticipantsSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await addParticipants(id, validation.data.animalIds);
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});
