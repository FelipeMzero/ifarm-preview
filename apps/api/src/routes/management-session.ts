import { Hono } from "hono";
import {
  addParticipants,
  cancelManagementSession,
  clearSessionAnimalStep,
  confirmManagementSession,
  createManagementSession,
  receiveSessionAnimal,
  removeParticipant,
  saveSessionAnimalStep,
  startManagementSession,
  updateManagementSession,
  updateReceptionDocuments,
} from "@ifarm/domain/management-session/mutations";
import {
  getManagementOptions,
  getManagementSession,
  getSessionAnimal,
  listManagementSessions,
} from "@ifarm/domain/management-session/queries";
import {
  managementSessionQuerySchema,
  managementSessionSchema,
  managementSessionStartSchema,
  receiveAnimalSchema,
  receptionDocumentsSchema,
  RESOURCE_ACCESS,
  sessionParticipantsSchema,
} from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../http";
import { requireSession } from "../session";

export const managementSessionRoutes = new Hono();

// Opções do planejamento e do registro (tipos sanitários, técnicas, pessoas, lotes).
managementSessionRoutes.get("/options", async (c) => {
  const { response, session } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    return c.json(
      await getManagementOptions(
        new URL(c.req.url).searchParams.get("propertyId"),
        session.user.id,
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
});

managementSessionRoutes.get("/", async (c) => {
  const { response, session } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { searchParams } = new URL(c.req.url);
    const query = managementSessionQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!query.success) {
      return c.json({ message: "Parâmetros inválidos." }, 400);
    }

    return c.json(await listManagementSessions(query.data, session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
});

managementSessionRoutes.post("/", async (c) => {
  const { response, session } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const validation = managementSessionSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createManagementSession(
      validation.data,
      session.user.id,
    );
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});

managementSessionRoutes.get("/:id", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getManagementSession(id));
  } catch (error) {
    return errorResponse(error);
  }
});

// Altera o planejamento enquanto a sessão não for consolidada ou cancelada.
managementSessionRoutes.put("/:id", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = managementSessionSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    await updateManagementSession(id, validation.data);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

// Cancela a sessão (os registros ficam gravados, mas não passam a valer).
managementSessionRoutes.post("/:id/cancel", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await cancelManagementSession(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

// Consolida a sessão: os registros passam a valer.
managementSessionRoutes.post("/:id/confirm", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const data = await confirmManagementSession(id);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});

// Inclui na sessão animais que não estavam no planejamento.
managementSessionRoutes.post("/:id/participants", async (c) => {
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

// Documentos da carga (GTA e nota fiscal) de uma recepção em aberto.
managementSessionRoutes.patch("/:id/reception", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.recepcoes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = receptionDocumentsSchema.safeParse(
      await c.req.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    await updateReceptionDocuments(id, validation.data);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

// Inicia o registro (ou corrige a data do manejo enquanto não consolidada).
managementSessionRoutes.post("/:id/start", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = managementSessionStartSchema.safeParse(
      await c.req.json(),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    await startManagementSession(id, validation.data);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

// Recebe um animal que desceu do caminhão (cria o animal e o inclui na sessão).
managementSessionRoutes.post("/:id/reception/animals", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = receiveAnimalSchema.safeParse(
      await c.req.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await receiveSessionAnimal(id, validation.data);
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});

// Tudo o que as telas de etapa precisam de um animal da sessão.
managementSessionRoutes.get("/:id/animals/:animalId", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id, animalId } = c.req.param();
    return c.json(await getSessionAnimal(id, animalId));
  } catch (error) {
    return errorResponse(error);
  }
});

// Tira o animal da sessão, desfazendo os registros que ele já tinha.
managementSessionRoutes.delete("/:id/participants/:animalId", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id, animalId } = c.req.param();
    await removeParticipant(id, animalId);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

// Registra (ou corrige) uma etapa do manejo no animal e devolve o contexto atualizado.
// Os dados são validados pelo módulo da etapa.
managementSessionRoutes.put("/:id/animals/:animalId/steps/:key", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id, animalId, key } = c.req.param();
    const data = await saveSessionAnimalStep(
      id,
      animalId,
      decodeURIComponent(key),
      await c.req.json(),
    );
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});

// Desfaz o registro da etapa no animal e devolve o contexto atualizado.
managementSessionRoutes.delete(
  "/:id/animals/:animalId/steps/:key",
  async (c) => {
    const { response } = await requireSession(RESOURCE_ACCESS.manejos);
    if (response) return response;

    try {
      const { id, animalId, key } = c.req.param();
      const data = await clearSessionAnimalStep(
        id,
        animalId,
        decodeURIComponent(key),
      );
      return c.json({ success: true, data });
    } catch (error) {
      return errorResponse(error);
    }
  },
);
