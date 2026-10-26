import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { listNeuteringTechniques } from "./handler";

export const listNeuteringTechniquesRoute = new Hono();

listNeuteringTechniquesRoute.get("/", async (c) => {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tecnicas-castracao"],
  );
  if (response) return response;

  try {
    return c.json({ data: await listNeuteringTechniques() });
  } catch (error) {
    return errorResponse(error);
  }
});
