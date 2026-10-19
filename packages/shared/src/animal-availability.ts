import type { AnimalStatus } from "./enums";
import { ANIMAL_STATUS_LABELS } from "./enum-labels";

// Por que o animal não pode mais participar de uma operação em aberto da propriedade
// (ex.: morreu ou foi transferido depois de ser incluído nela); null = pode participar.
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
