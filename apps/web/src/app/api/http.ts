import { NextResponse } from "next/server";
import type { z } from "zod";
import { ConflictError, NotFoundError, ValidationError } from "@/server/errors";

// Erros de validação no formato que os formulários esperam: a primeira mensagem de cada campo.
export function validationErrorResponse(error: z.ZodError) {
  const errors: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const field = issue.path[0] as string;
    if (field && !errors[field]) errors[field] = issue.message;
  });
  return NextResponse.json({ success: false, errors }, { status: 400 });
}

// Converte os erros lançados por server/ em respostas HTTP.
export function errorResponse(error: unknown) {
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
        : { success: false, message: error.message },
      { status: 409 },
    );
  }

  console.error(error);
  return NextResponse.json(
    { success: false, message: "Ocorreu um erro interno no servidor." },
    { status: 500 },
  );
}
