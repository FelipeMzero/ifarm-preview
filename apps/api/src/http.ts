import { ZodError, type z } from "zod";
import {
  BusinessError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@ifarm/domain/errors";

// Parâmetro de rota que é UUID (os ids no banco são `@db.Uuid`): um valor em outro formato não
// casa com a rota e recebe 404, sem chegar ao banco (que recusaria a consulta com um 500).
// Uso: `/${uuidParam("id")}/animals/${uuidParam("animalId")}`.
const UUID =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
// O tipo literal (`as const`) deixa o Hono deduzir o nome do parâmetro em `c.req.param()`.
export const uuidParam = <N extends string>(name: N) =>
  `:${name}{${UUID}}` as const;

// Erros de validação no formato que os formulários esperam: a primeira mensagem de cada campo
// (campos aninhados como "steps.0.value").
export function validationErrorResponse(error: z.ZodError) {
  const errors: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const field = issue.path.join(".");
    if (field && !errors[field]) errors[field] = issue.message;
  });
  return Response.json({ success: false, errors }, { status: 400 });
}

/**
 * Converte os erros lançados pelo domínio (@ifarm/domain) em respostas HTTP. Com `field`, um BusinessError é
 * apresentado nesse campo do formulário (null = só a mensagem) em vez do campo do próprio erro.
 */
export function errorResponse(
  error: unknown,
  options: { field?: string | null } = {},
) {
  // Validação feita dentro do domínio (ex.: dados de uma etapa de manejo).
  if (error instanceof ZodError) return validationErrorResponse(error);

  if (error instanceof BusinessError) {
    const field = options.field === undefined ? error.field : options.field;
    return Response.json(
      {
        success: false,
        message: error.message,
        ...(field ? { errors: { [field]: error.message } } : {}),
        ...error.details,
      },
      { status: error.status },
    );
  }

  if (error instanceof NotFoundError) {
    return Response.json(
      { success: false, message: error.message },
      { status: 404 },
    );
  }

  if (error instanceof ValidationError) {
    return Response.json(
      error.fieldErrors
        ? { success: false, errors: error.fieldErrors }
        : { success: false, message: error.message },
      { status: 400 },
    );
  }

  if (error instanceof ConflictError) {
    return Response.json(
      error.fieldErrors
        ? { success: false, errors: error.fieldErrors }
        : { success: false, message: error.message, ...error.details },
      { status: 409 },
    );
  }

  console.error(error);
  return Response.json(
    { success: false, message: "Ocorreu um erro interno no servidor." },
    { status: 500 },
  );
}
