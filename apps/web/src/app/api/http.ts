import { NextResponse } from "next/server";
import { ZodError, type z } from "zod";
import {
  BusinessError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@ifarm/domain/errors";

// Erros de validação no formato que os formulários esperam: a primeira mensagem de cada campo
// (campos aninhados como "steps.0.value").
export function validationErrorResponse(error: z.ZodError) {
  const errors: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const field = issue.path.join(".");
    if (field && !errors[field]) errors[field] = issue.message;
  });
  return NextResponse.json({ success: false, errors }, { status: 400 });
}

/**
 * Converte os erros lançados por server/ em respostas HTTP. Com `field`, um BusinessError é
 * apresentado nesse campo do formulário (null = só a mensagem) em vez do campo do próprio erro.
 */
export function errorResponse(
  error: unknown,
  options: { field?: string | null } = {},
) {
  // Validação feita dentro de server/ (ex.: dados de uma etapa de manejo).
  if (error instanceof ZodError) return validationErrorResponse(error);

  if (error instanceof BusinessError) {
    const field = options.field === undefined ? error.field : options.field;
    return NextResponse.json(
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
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 },
    );
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      error.fieldErrors
        ? { success: false, errors: error.fieldErrors }
        : { success: false, message: error.message },
      { status: 400 },
    );
  }

  if (error instanceof ConflictError) {
    return NextResponse.json(
      error.fieldErrors
        ? { success: false, errors: error.fieldErrors }
        : { success: false, message: error.message, ...error.details },
      { status: 409 },
    );
  }

  console.error(error);
  return NextResponse.json(
    { success: false, message: "Ocorreu um erro interno no servidor." },
    { status: 500 },
  );
}
