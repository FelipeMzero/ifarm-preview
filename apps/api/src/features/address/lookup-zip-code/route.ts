import { Hono } from "hono";
import { requireSession } from "../../../session";
import { externalErrorResponse } from "../external";
import { lookupZipCode } from "./handler";

export const lookupZipCodeRoute = new Hono();

// Endereço pelo CEP (com ou sem máscara). CEP inexistente: { data: null }.
lookupZipCodeRoute.get("/zip/:cep", async (c) => {
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
