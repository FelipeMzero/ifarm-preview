import {
  formatDate as formatDay,
  formatEventDateTime,
  fromLocalDateTime,
  toLocalDay,
} from "@ifarm/shared";

// Data e hora de um evento (instante ISO), no fuso local. Aceita também um dia ("AAAA-MM-DD"),
// porque as linhas do tempo misturam eventos com hora e datas que são só o dia (compra).
export function formatInstant(iso: string | null | undefined): string {
  if (!iso) return "—";
  if (iso.length === 10) return formatDay(iso);
  return formatEventDateTime(fromLocalDateTime(new Date(iso)));
}

// Instante ISO → valor do <input type="datetime-local">, no fuso local.
export const toInputDateTime = (iso: string) =>
  fromLocalDateTime(new Date(iso));

// Instante ISO ou dia ("AAAA-MM-DD", ex.: data da compra) → "DD/MM/AAAA".
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  if (iso.length === 10) return formatDay(iso);
  return new Date(iso).toLocaleDateString("pt-BR");
}

// Campos só de data (sem horário) chegam como "yyyy-mm-dd".
export function formatDateOnly(iso: string | null | undefined): string {
  if (!iso) return "—";
  return formatDay(iso);
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

export const DAY_MS = 24 * 60 * 60 * 1000;

export function daysBetween(
  from: string,
  to: string | Date = new Date(),
): number {
  const end = typeof to === "string" ? new Date(to) : to;
  return Math.max(
    0,
    Math.round((end.getTime() - new Date(from).getTime()) / DAY_MS),
  );
}

export function formatDuration(days: number): string {
  if (days < 1) return "menos de 1 dia";
  if (days < 60) return days === 1 ? "1 dia" : `${days} dias`;
  const months = Math.floor(days / 30.44);
  if (months < 24) return `${months} meses`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years} anos e ${rest} m` : `${years} anos`;
}

export function formatAge(birthDate: string): string {
  const birth = toLocalDay(birthDate);
  const now = new Date();
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;

  if (months < 1) {
    const days = daysBetween(birth.toISOString(), now);
    return days === 1 ? "1 dia" : `${days} dias`;
  }
  if (months < 12) return months === 1 ? "1 mês" : `${months} meses`;

  const years = Math.floor(months / 12);
  const rest = months % 12;
  const yearsLabel = years === 1 ? "1 ano" : `${years} anos`;
  if (!rest) return yearsLabel;
  return `${yearsLabel} e ${rest === 1 ? "1 mês" : `${rest} meses`}`;
}
