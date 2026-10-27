import { daysBetween, toLocalDay } from "@ifarm/shared";

// Formatação da tela do animal. Datas: formatDay / formatDateTime, do @ifarm/shared.

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

export function formatDuration(days: number): string {
  if (days < 1) return "menos de 1 dia";
  if (days < 60) return days === 1 ? "1 dia" : `${days} dias`;
  const months = Math.floor(days / 30.44);
  if (months < 24) return `${months} meses`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years} anos e ${rest} m` : `${years} anos`;
}

// Idade em meses completos na data (negativa se anterior ao nascimento).
export function monthsOld(birth: Date, at: Date): number {
  const months =
    (at.getFullYear() - birth.getFullYear()) * 12 +
    (at.getMonth() - birth.getMonth());
  return at.getDate() < birth.getDate() ? months - 1 : months;
}

export function formatAge(birthDate: string): string {
  const birth = toLocalDay(birthDate);
  const now = new Date();
  const months = monthsOld(birth, now);

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
