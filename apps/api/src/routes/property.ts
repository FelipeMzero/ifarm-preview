import { Hono } from "hono";
import {
  createProperty,
  deleteProperty,
  togglePropertyStatus,
  updateProperty,
} from "@ifarm/domain/property/mutations";
import {
  getProperty,
  listProperties,
  listPropertyOptions,
} from "@ifarm/domain/property/queries";
import {
  propertyQuerySchema,
  propertySchema,
  RESOURCE_ACCESS,
} from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../http";
import { requireSession } from "../session";

export const propertyRoutes = new Hono();

// Lista enxuta de propriedades para o seletor de "propriedade atual" (troca de contexto).
// Sem restrição de papel: mesmo quem não pode gerenciar propriedades precisa escolher
// em qual está trabalhando.
propertyRoutes.get("/options", async (c) => {
  const { response } = await requireSession();
  if (response) return response;

  try {
    return c.json({ data: await listPropertyOptions() });
  } catch (error) {
    return errorResponse(error);
  }
});

propertyRoutes.get("/", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.propriedades);
  if (response) return response;

  try {
    const { searchParams } = new URL(c.req.url);
    const validation = propertyQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!validation.success) {
      return c.json({ message: "Parâmetros inválidos." }, 400);
    }

    return c.json(await listProperties(validation.data));
  } catch (error) {
    return errorResponse(error);
  }
});

propertyRoutes.post("/", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.propriedades);
  if (response) return response;

  try {
    const validation = propertySchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createProperty(validation.data);
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});

propertyRoutes.get("/:id", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.propriedades);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getProperty(id));
  } catch (error) {
    return errorResponse(error);
  }
});

propertyRoutes.put("/:id", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.propriedades);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = propertySchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await updateProperty(id, validation.data);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});

propertyRoutes.delete("/:id", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.propriedades);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await deleteProperty(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

// Ativa ou desativa a propriedade.
propertyRoutes.patch("/:id", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.propriedades);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const data = await togglePropertyStatus(id);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});
