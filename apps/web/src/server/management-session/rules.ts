import {
  REPEATABLE_STEP_TYPES,
  STEP_TYPE_LABELS,
  type ManagementSessionStatus,
  type StepType,
} from "@ifarm/shared";
import type { Prisma } from "@/server/db";

// Regras da sessão de manejo e das etapas, sem banco.

// Filtro de cada situação na consulta, coerente com sessionStatus (ver o teste).
// "open" = planejadas e em andamento.
export const SESSION_STATUS_WHERE = {
  open: { confirmedAt: null, cancelledAt: null },
  planned: { performedAt: null, confirmedAt: null, cancelledAt: null },
  in_progress: {
    performedAt: { not: null },
    confirmedAt: null,
    cancelledAt: null,
  },
  confirmed: { confirmedAt: { not: null }, cancelledAt: null },
  cancelled: { cancelledAt: { not: null } },
} satisfies Record<
  ManagementSessionStatus | "open",
  Prisma.ManagementSessionWhereInput
>;

// Cada tipo de etapa aparece uma vez no planejamento, exceto os repetíveis (sanitário).
// Devolve a mensagem do primeiro tipo repetido (null = ok).
export function repeatedStepMessage(plan: { type: StepType }[]): string | null {
  const counts = new Map<StepType, number>();
  for (const { type } of plan) counts.set(type, (counts.get(type) ?? 0) + 1);
  for (const [type, count] of counts) {
    if (count > 1 && !REPEATABLE_STEP_TYPES.includes(type)) {
      return `O manejo "${STEP_TYPE_LABELS[type]}" só pode aparecer uma vez.`;
    }
  }
  return null;
}

// Manejados na consolidação: quem tem algum registro. Na recepção de compra todo
// participante é um animal recebido (já existe) e conta como manejado.
export function splitHandled<T>(
  participants: T[],
  hasRecords: (p: T) => boolean,
  isReception: boolean,
) {
  const handled: T[] = [];
  const notHandled: T[] = [];
  for (const p of participants) {
    if (isReception || hasRecords(p)) handled.push(p);
    else notHandled.push(p);
  }
  return { handled, notHandled };
}

// --- Sanitário ---

type DoseType = "NONE" | "FIXED" | "PER_WEIGHT";

export const requiresDose = (doseType: DoseType) => doseType !== "NONE";

// Campos de dose gravados no procedimento: sem dose, nenhum; peso de referência só na
// dose por peso.
export function plannedDose(plan: {
  doseType: DoseType;
  doseMl?: number | null;
  doseWeightKg?: number | null;
}) {
  return {
    doseMl: requiresDose(plan.doseType) ? (plan.doseMl ?? null) : null,
    doseWeightKg:
      plan.doseType === "PER_WEIGHT" ? (plan.doseWeightKg ?? null) : null,
  };
}

// Registros já feitos seguem a regra de dose da época: com dose, todos têm a dose
// aplicada; sem dose, nenhum tem. Trocar entre os dois os deixaria incoerentes.
export function doseChangeBlocker(
  current: { doseType: DoseType; recordCount: number },
  nextDoseType: DoseType,
): string | null {
  if (!current.recordCount) return null;
  if (requiresDose(current.doseType) === requiresDose(nextDoseType))
    return null;
  return `O procedimento sanitário já foi registrado em ${current.recordCount} animal(is): não é possível ${requiresDose(nextDoseType) ? "incluir" : "retirar"} a dose. Desfaça os registros antes.`;
}

// --- Brinco / RFID ---

// O valor já foi registrado para outro animal nesta sessão?
export function takenInSession(
  items: { animalId: string; value: string | null }[],
  animalId: string,
  value: string,
) {
  return items.some((i) => i.animalId !== animalId && i.value === value);
}
