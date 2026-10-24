import { Hono } from "hono";
import { geocodeQuerySchema } from "@ifarm/shared";
import { validationErrorResponse } from "../http";
import {
  ExternalServiceError,
  geocode,
  lookupZipCode,
} from "../services/address";
import { requireSession } from "../session";

export const addressRoutes = new Hono();

// Falha do serviço externo: 502, com a mensagem para a tela.
function externalErrorResponse(error: unknown, message: string) {
  if (error instanceof ExternalServiceError) {
    console.warn(error.message);
    return Response.json({ message }, { status: 502 });
  }
  throw error;
}

// Endereço pelo CEP (com ou sem máscara). CEP inexistente: { data: null }.
addressRoutes.get("/zip/:cep", async (c) => {
  const { response } = await requireSession();
  if (response) return response;

  const digits = c.req.param("cep").replace(/\D/g, "");
  if (digits.length !== 8) {
    return c.json(
      { success: false, errors: { zipCode: "CEP inválido." } },
      400,
    );
  }

  try {
    return c.json({ data: await lookupZipCode(digits) });
  } catch (error) {
    return externalErrorResponse(
      error,
      "Não foi possível buscar o endereço pelo CEP.",
    );
  }
});

// Coordenadas aproximadas pelo endereço. Nada encontrado: { data: null }.
addressRoutes.get("/geocode", async (c) => {
  const { response } = await requireSession();
  if (response) return response;

  const query = geocodeQuerySchema.safeParse(
    Object.fromEntries(new URL(c.req.url).searchParams),
  );
  if (!query.success) return validationErrorResponse(query.error);

  try {
    return c.json({ data: await geocode(query.data) });
  } catch (error) {
    return externalErrorResponse(
      error,
      "Não foi possível localizar o endereço.",
    );
  }
});
