import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { getAnimalCommitments } from "./handler";

export const getAnimalCommitmentsRoute = new Hono();

// Operações abertas que já contam com o animal, para as telas avisarem antes de salvar.
getAnimalCommitmentsRoute.get(`/${uuidParam("id")}/commitments`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getAnimalCommitments(id));
  } catch (error) {
    return errorResponse(error);
  }
});
