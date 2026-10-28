import { describe, expect, it } from "vitest";
import { ApiError, isClientError, isNotFoundError, readJson } from "./client";

// O erro com que a promessa falha (o teste confere que é um ApiError).
const rejection = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error("A promessa deveria ter falhado.");
    },
    (e: ApiError) => e,
  );

const response = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe("readJson", () => {
  it("devolve o corpo de uma resposta de sucesso", async () => {
    await expect(readJson(response(200, { a: 1 }), "falhou")).resolves.toEqual({
      a: 1,
    });
  });

  it("lança ApiError com a mensagem, os erros por campo e o status", async () => {
    const error = await rejection(
      readJson(
        response(400, {
          message: "Dados inválidos.",
          errors: { name: "Obrigatório" },
        }),
        "falhou",
      ),
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("Dados inválidos.");
    expect(error.errors).toEqual({ name: "Obrigatório" });
    expect(error.status).toBe(400);
  });

  it("usa a mensagem padrão quando a API não manda uma", async () => {
    const error = await rejection(readJson(response(500, null), "falhou"));
    expect(error.message).toBe("falhou");
    expect(error.status).toBe(500);
  });
});

describe("isClientError / isNotFoundError", () => {
  const withStatus = (status?: number) =>
    new ApiError("x", undefined, undefined, status);

  it("separa 4xx (não adianta repetir) de 5xx e de erros sem status", () => {
    expect(isClientError(withStatus(404))).toBe(true);
    expect(isClientError(withStatus(403))).toBe(true);
    expect(isClientError(withStatus(500))).toBe(false);
    expect(isClientError(withStatus())).toBe(false);
    expect(isClientError(new TypeError("Failed to fetch"))).toBe(false);
  });

  it("reconhece só o 404 como não encontrado", () => {
    expect(isNotFoundError(withStatus(404))).toBe(true);
    expect(isNotFoundError(withStatus(400))).toBe(false);
  });
});
