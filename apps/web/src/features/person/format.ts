/** Telefone para exibição: "(11) 91234-5678" ou "(11) 1234-5678"; outro formato fica como veio. */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11)
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digits.length === 10)
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return value;
}
