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
