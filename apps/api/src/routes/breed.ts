import { Hono } from "hono";
import {
  createBreed,
  deleteBreed,
  toggleBreedStatus,
  updateBreed,
} from "@ifarm/domain/breed/mutations";
import { listBreeds } from "@ifarm/domain/breed/queries";
import { breedSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../http";
import { requireSession } from "../session";

export const breedRoutes = new Hono();

breedRoutes.get("/", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.racas);
  if (response) return response;

  try {
    return c.json({ data: await listBreeds() });
  } catch (error) {
    return errorResponse(error);
  }
});

breedRoutes.post("/", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.racas);
  if (response) return response;

  try {
    const validation = breedSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createBreed(validation.data);
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});

breedRoutes.put("/:id", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.racas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = breedSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await updateBreed(id, validation.data);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});

breedRoutes.delete("/:id", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.racas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await deleteBreed(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

// Ativa ou desativa a raça.
breedRoutes.patch("/:id", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.racas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const data = await toggleBreedStatus(id);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});
