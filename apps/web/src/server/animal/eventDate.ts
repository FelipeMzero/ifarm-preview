import "server-only";
import { prisma } from "@/lib/prisma";

// Valida a data de um manejo avulso (pesagem, castração) e devolve o instante a gravar:
// hoje usa a hora atual (fica depois dos registros anteriores do dia); dias passados
// ficam à meia-noite local. Devolve { ok: false, error } quando a data é inválida.
export async function resolveEventDate(
  animalId: string,
  date: Date | undefined,
): Promise<{ ok: true; at: Date } | { ok: false; error: string }> {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (!date || date.getTime() === today.getTime()) return { ok: true, at: now };
  if (date > today) return { ok: false, error: "A data não pode ser futura." };

  const animal = await prisma.animal.findUnique({
    where: { id: animalId },
    select: { birthDate: true },
  });
  // birthDate é só data (UTC 00:00); comparamos no fuso local, como as demais datas.
  const birth = animal?.birthDate
    ? new Date(`${animal.birthDate.toISOString().slice(0, 10)}T00:00:00`)
    : null;
  if (birth && date < birth) {
    return {
      ok: false,
      error: `A data não pode ser anterior ao nascimento do animal (${birth.toLocaleDateString("pt-BR")}).`,
    };
  }

  return { ok: true, at: date };
}
