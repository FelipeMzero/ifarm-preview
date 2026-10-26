import { ValidationError } from "../../lib/errors";

// Usados por mais de uma operação de animal.

export const fieldError = (field: string, message: string) =>
  new ValidationError(message, { [field]: message });
