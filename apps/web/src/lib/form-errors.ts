import { toast } from "sonner";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@ifarm/shared";

/**
 * Mostra no formulário o erro de um envio à API:
 * - erros por campo (validação da API): marca cada campo e avisa para conferi-los;
 * - erro com mensagem da API (ex.: registro duplicado, regra de negócio): mostra a mensagem;
 * - qualquer outro (rede fora, erro inesperado): mostra `fallbackMessage`.
 */
export function applyServerErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  error: unknown,
  fallbackMessage = "A requisição falhou! Tente novamente.",
) {
  if (
    error instanceof ApiError &&
    error.errors &&
    Object.keys(error.errors).length
  ) {
    for (const [field, message] of Object.entries(error.errors)) {
      setError(field as Path<T>, { type: "server", message });
    }
    toast.error("Verifique os campos destacados.");
    return;
  }
  toast.error(error instanceof ApiError ? error.message : fallbackMessage);
}
