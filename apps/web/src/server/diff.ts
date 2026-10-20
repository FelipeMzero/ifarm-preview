// Diferença entre o que está gravado e a nova lista de ids (participantes de uma sessão,
// itens de uma transferência...): quem sai, quem entra e quem continua. Assim só a
// diferença é gravada e os registros que continuam preservam os dados deles.

export function diffIds<T>(
  current: T[],
  nextIds: string[],
  idOf: (item: T) => string,
) {
  const next = new Set(nextIds);
  const currentIds = new Set(current.map(idOf));
  return {
    removed: current.filter((item) => !next.has(idOf(item))),
    added: nextIds.filter((id) => !currentIds.has(id)),
    kept: nextIds.filter((id) => currentIds.has(id)),
  };
}
