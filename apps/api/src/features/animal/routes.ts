import { Hono } from "hono";
import { CommitmentError } from "./commitments";
import {
  addIdentifier,
  cancelIdentifier,
  correctIdentifier,
  isIdentifierKind,
  listIdentifiers,
} from "./identifiers";
import {
  addNeutering,
  addWeighing,
  cancelNeutering,
  cancelWeighing,
  correctNeutering,
  correctWeighing,
  createAnimal,
  deleteAnimal,
  updateAnimal,
} from "./mutations";
import {
  getAnimal,
  getAnimalCommitments,
  getAnimalDetails,
  listAnimals,
  listCommitments,
  listNeuterings,
  listWeighings,
} from "./queries";
import {
  animalCreateSchema,
  animalQuerySchema,
  animalUpdateSchema,
  commitmentsLookupSchema,
  identifierChangeSchemaFor,
  identifierCorrectionSchemaFor,
  neuteringCancelSchema,
  neuteringCorrectionSchema,
  neuteringCreateSchema,
  RESOURCE_ACCESS,
  weighingCorrectionSchema,
  weighingCreateSchema,
} from "@ifarm/shared";
import { errorResponse, uuidParam, validationErrorResponse } from "../../http";
import { requireSession } from "../../session";

const notFound = () =>
  Response.json(
    { success: false, message: "Não encontrado." },
    { status: 404 },
  );

const recordNotFound = () =>
  Response.json({ message: "Não encontrado." }, { status: 404 });

export const animalRoutes = new Hono();

// Compromissos em aberto de vários animais de uma vez (POST porque a lista não cabe
// numa URL), para o seletor marcar os indisponíveis.
animalRoutes.post("/commitments", async (c) => {
  // Mesma permissão da listagem de animais que alimenta o seletor.
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const validation = commitmentsLookupSchema.safeParse(
      await c.req.json().catch(() => ({})),
    );
    if (!validation.success) {
      return c.json({ message: "Parâmetros inválidos." }, 400);
    }

    const { animalIds, ...exclude } = validation.data;
    return c.json(await listCommitments(animalIds, exclude));
  } catch (error) {
    return errorResponse(error);
  }
});

animalRoutes.get("/", async (c) => {
  const { response, session } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { searchParams } = new URL(c.req.url);
    const validation = animalQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!validation.success) {
      return c.json({ message: "Parâmetros inválidos." }, 400);
    }

    return c.json(await listAnimals(validation.data, session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
});

animalRoutes.post("/", async (c) => {
  const { response, session } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const validation = animalCreateSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createAnimal(validation.data, session.user.id);
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});

animalRoutes.get(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getAnimal(id));
  } catch (error) {
    return errorResponse(error);
  }
});

animalRoutes.put(`/${uuidParam("id")}`, async (c) => {
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

animalRoutes.delete(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await deleteAnimal(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

// Operações abertas que já contam com o animal, para as telas avisarem antes de salvar.
animalRoutes.get(`/${uuidParam("id")}/commitments`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getAnimalCommitments(id));
  } catch (error) {
    return errorResponse(error);
  }
});

// Ficha completa do animal (históricos e compra de origem).
animalRoutes.get(`/${uuidParam("id")}/details`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getAnimalDetails(id));
  } catch (error) {
    return errorResponse(error);
  }
});

// Castrações válidas (não canceladas), da mais recente para a mais antiga.
animalRoutes.get(`/${uuidParam("id")}/neuterings`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await listNeuterings(id));
  } catch (error) {
    return errorResponse(error);
  }
});

// Registra uma castração avulsa na hora (recastração exige o motivo).
animalRoutes.post(`/${uuidParam("id")}/neuterings`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = neuteringCreateSchema.safeParse(
      await c.req.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    await addNeutering(id, validation.data);
    return c.json({ success: true }, 201);
  } catch (error) {
    // Conflito de compromisso aparece só como mensagem, sem campo do formulário.
    return errorResponse(error, { field: null });
  }
});

animalRoutes.get(`/${uuidParam("id")}/weighings`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await listWeighings(id));
  } catch (error) {
    return errorResponse(error);
  }
});

// Registra uma pesagem avulsa na hora (o peso atual passa a ser o da mais recente).
animalRoutes.post(`/${uuidParam("id")}/weighings`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = weighingCreateSchema.safeParse(
      await c.req.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    await addWeighing(id, validation.data);
    return c.json({ success: true }, 201);
  } catch (error) {
    // Conflito de compromisso aparece só como mensagem, sem campo do formulário.
    return errorResponse(error, { field: null });
  }
});

// Histórico válido (não excluído) de brincos ou RFIDs do animal, do mais recente
// para o mais antigo.
animalRoutes.get(`/${uuidParam("id")}/identifiers/:kind`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id, kind } = c.req.param();
    if (!isIdentifierKind(kind)) return recordNotFound();
    return c.json(await listIdentifiers(kind, id));
  } catch (error) {
    return errorResponse(error);
  }
});

// Troca (ou remove, com value vazio) o identificador na hora.
animalRoutes.post(`/${uuidParam("id")}/identifiers/:kind`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id, kind } = c.req.param();
    if (!isIdentifierKind(kind)) return recordNotFound();

    const validation = identifierChangeSchemaFor(kind).safeParse(
      await c.req.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    await addIdentifier(kind, id, validation.data);
    return c.json({ success: true }, 201);
  } catch (error) {
    // Conflito de compromisso aparece só como mensagem, sem campo do formulário.
    return errorResponse(
      error,
      error instanceof CommitmentError ? { field: null } : {},
    );
  }
});

animalRoutes.patch(`/${uuidParam("id")}/neuterings/:neuteringId`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id, neuteringId } = c.req.param();
    const validation = neuteringCorrectionSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    await correctNeutering(id, neuteringId, validation.data);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

animalRoutes.delete(
  `/${uuidParam("id")}/neuterings/:neuteringId`,
  async (c) => {
    const { response } = await requireSession(RESOURCE_ACCESS.animais);
    if (response) return response;

    try {
      const { id, neuteringId } = c.req.param();
      const validation = neuteringCancelSchema.safeParse(
        await c.req.json().catch(() => ({})),
      );
      if (!validation.success) {
        return c.json(
          { success: false, message: "Parâmetros inválidos." },
          400,
        );
      }

      await cancelNeutering(id, neuteringId, validation.data);
      return c.json({ success: true });
    } catch (error) {
      return errorResponse(error);
    }
  },
);

animalRoutes.patch(`/${uuidParam("id")}/weighings/:weighingId`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id, weighingId } = c.req.param();
    const validation = weighingCorrectionSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    await correctWeighing(id, weighingId, validation.data);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

animalRoutes.delete(`/${uuidParam("id")}/weighings/:weighingId`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id, weighingId } = c.req.param();
    await cancelWeighing(id, weighingId);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

// Corrige valor, data (só registros avulsos) e observação de um brinco/RFID.
animalRoutes.patch(
  `/${uuidParam("id")}/identifiers/:kind/:recordId`,
  async (c) => {
    const { response } = await requireSession(RESOURCE_ACCESS.animais);
    if (response) return response;

    try {
      const { id, kind, recordId } = c.req.param();
      if (!isIdentifierKind(kind)) return notFound();

      const validation = identifierCorrectionSchemaFor(kind).safeParse(
        await c.req.json().catch(() => ({})),
      );
      if (!validation.success) return validationErrorResponse(validation.error);

      await correctIdentifier(kind, id, recordId, validation.data);
      return c.json({ success: true });
    } catch (error) {
      return errorResponse(error);
    }
  },
);

// Exclusão lógica: o registro sai do histórico e o identificador atual é recalculado.
animalRoutes.delete(
  `/${uuidParam("id")}/identifiers/:kind/:recordId`,
  async (c) => {
    const { response } = await requireSession(RESOURCE_ACCESS.animais);
    if (response) return response;

    try {
      const { id, kind, recordId } = c.req.param();
      if (!isIdentifierKind(kind)) return notFound();

      await cancelIdentifier(kind, id, recordId);
      return c.json({ success: true });
    } catch (error) {
      return errorResponse(error);
    }
  },
);
