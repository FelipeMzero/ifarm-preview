import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { ApiError, formatDate } from "@ifarm/shared";

// Leva os erros da API para os campos do formulário da etapa e avisa o usuário.
export function handleStepError<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: unknown,
) {
  if (error instanceof ApiError) {
    Object.entries(error.errors ?? {}).forEach(([field, message]) =>
      form.setError(field as Path<T>, { type: "server", message }),
    );
    toast.error(error.message);
  } else {
    toast.error("A requisição falhou! Tente novamente.");
  }
}

export const formatKg = (value: number) =>
  `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`;

export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// "AAAA-MM-DD" (dia) ou ISO completo (instante).
export const formatDay = (iso: string) =>
  iso.length === 10
    ? formatDate(iso)
    : new Date(iso).toLocaleDateString("pt-BR");
