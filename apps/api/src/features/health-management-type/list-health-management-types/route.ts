import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { listHealthManagementTypes } from "./handler";

export const listHealthManagementTypesRoute = new Hono();

listHealthManagementTypesRoute.get("/", async (c) => {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tipos-sanitarios"],
  );
  if (response) return response;

  try {
    return c.json({ data: await listHealthManagementTypes() });
  } catch (error) {
    return errorResponse(error);
  }
});
