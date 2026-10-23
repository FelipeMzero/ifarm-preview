import { Hono } from "hono";
import { setCurrentProperty } from "@ifarm/domain/current-property/mutations";
import {
  getCurrentPropertyDetails,
  getOrAssignCurrentProperty,
} from "@ifarm/domain/current-property/queries";
import { currentPropertySchema } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../http";
import { requireSession } from "../session";

export const userRoutes = new Hono();

// Retorna a propriedade atualmente selecionada pelo usuário logado. Se ele ainda não
// tiver escolhido nenhuma, assume automaticamente a mais antiga cadastrada (ou `null`
// se não houver nenhuma propriedade no sistema).
userRoutes.get("/current-property", async (c) => {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const data = await getOrAssignCurrentProperty(session.user.id);
    return c.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
});

userRoutes.put("/current-property", async (c) => {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const validation = currentPropertySchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await setCurrentProperty(
      session.user.id,
      validation.data.propertyId,
    );
    return c.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
});

// Detalhes da propriedade atualmente selecionada, para exibição no painel. Sem
// restrição de papel: qualquer usuário logado precisa ver em qual propriedade está.
userRoutes.get("/current-property/details", async (c) => {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const data = await getCurrentPropertyDetails(session.user.id);
    return c.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
});
