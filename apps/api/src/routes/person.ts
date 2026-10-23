import { Hono } from "hono";
import {
  createPerson,
  deletePerson,
  togglePersonStatus,
  updatePerson,
} from "@ifarm/domain/person/mutations";
import { getPerson, listPeople } from "@ifarm/domain/person/queries";
import {
  personQuerySchema,
  personSchema,
  RESOURCE_ACCESS,
} from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../http";
import { requireSession } from "../session";

export const personRoutes = new Hono();

personRoutes.get("/", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const { searchParams } = new URL(c.req.url);
    const validation = personQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!validation.success) {
      return c.json({ message: "Parâmetros inválidos." }, 400);
    }

    return c.json(await listPeople(validation.data));
  } catch (error) {
    return errorResponse(error);
  }
});

personRoutes.post("/", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const validation = personSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createPerson(validation.data);
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});

personRoutes.get("/:id", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getPerson(id));
  } catch (error) {
    return errorResponse(error);
  }
});

personRoutes.put("/:id", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = personSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await updatePerson(id, validation.data);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});

personRoutes.delete("/:id", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await deletePerson(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

// Ativa ou desativa a pessoa.
personRoutes.patch("/:id", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const data = await togglePersonStatus(id);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});
