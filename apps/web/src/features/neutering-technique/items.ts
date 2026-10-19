// Opções do select de técnica: as ativas, mais a já gravada no registro (que pode
// ter sido inativada depois), para não sumir ao editar. Com `optional`, inclui
// "Não informada" (valor "").
export function techniqueItems(
  techniques: { id: string; name: string; deactivatedAt?: string | null }[],
  {
    current,
    optional = false,
  }: {
    current?: { id: string | null; name: string | null } | null;
    optional?: boolean;
  } = {},
) {
  const items = techniques
    .filter((t) => !t.deactivatedAt || t.id === current?.id)
    .map((t) => ({ value: t.id, label: t.name }));
  if (
    current?.id &&
    current.name &&
    !items.some((item) => item.value === current.id)
  ) {
    items.push({ value: current.id, label: current.name });
  }
  return optional ? [{ value: "", label: "Não informada" }, ...items] : items;
}
