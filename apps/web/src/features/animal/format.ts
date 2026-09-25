export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

// Campos só de data (sem horário) chegam como "yyyy-mm-dd" e devem ser lidos no fuso local.
export function formatDateOnly(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

export function formatKg(value: number, fractionDigits = 2): string {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: fractionDigits })} kg`;
}

export function formatSignedKg(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatKg(Math.abs(value))}`;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
