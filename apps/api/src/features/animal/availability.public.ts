import { ANIMAL_STATUS_LABELS, type AnimalStatus } from "@ifarm/shared";

// Disponibilidade do animal para uma operação (transferência, sessão de manejo) e os rótulos
// usados nas mensagens sobre animais: usados pelas transferências e pelas sessões de manejo.

// Por que o animal não pode mais participar de uma operação em aberto da propriedade
// (ex.: morreu ou foi transferido depois de ser incluído nela); null = pode participar.
// A API manda o motivo pronto às telas (campo unavailableReason).
// Ver "Operações com animais selecionados" em docs/requirements/comum.md.
export function unavailableReason(
  animal: { status: AnimalStatus; currentPropertyId: string },
  propertyId: string,
): string | null {
  if (animal.status !== "ACTIVE") return ANIMAL_STATUS_LABELS[animal.status];
  if (animal.currentPropertyId !== propertyId) return "Em outra propriedade";
  return null;
}

export function unavailableAnimalsMessage(labels: string) {
  return `Animais que não estão mais ativos na propriedade: ${labels}. Remova-os antes de consolidar.`;
}

// Identificação legível do animal em mensagens (brinco → RFID → ID).
export function animalLabel(a: {
  code: number;
  currentTag: string | null;
  currentRfid: string | null;
}) {
  if (a.currentTag) return `brinco ${a.currentTag}`;
  if (a.currentRfid) return `RFID ${a.currentRfid}`;
  return `ID ${a.code}`;
}

// Lista curta para mensagens: os primeiros `max` itens e "e mais N".
export function summarize(labels: string[], max = 5) {
  const shown = labels.slice(0, max).join(", ");
  return labels.length > max ? `${shown} e mais ${labels.length - max}` : shown;
}
