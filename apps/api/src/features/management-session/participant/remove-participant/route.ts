import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../../http";
import { requireSession } from "../../../../session";
import { removeParticipant } from "./handler";

export const removeParticipantRoute = new Hono();

// Tira o animal da sessão, desfazendo os registros que ele já tinha.
removeParticipantRoute.delete(
  `/${uuidParam("id")}/participants/${uuidParam("animalId")}`,
  async (c) => {
    const { response } = await requireSession(RESOURCE_ACCESS.manejos);
    if (response) return response;

    try {
      const { id, animalId } = c.req.param();
      await removeParticipant(id, animalId);
      return c.json({ success: true });
    } catch (error) {
      return errorResponse(error);
    }
  },
);
