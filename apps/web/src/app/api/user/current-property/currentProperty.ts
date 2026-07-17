import { prisma } from "@/lib/prisma";

export type CurrentPropertyOption = {
  id: string;
  name: string;
};

// Se o usuário nunca teve uma propriedade selecionada, assume automaticamente a
// propriedade ativa mais antiga cadastrada, sem exigir escolha manual no primeiro
// acesso. Mas se ele já tinha uma seleção válida e ela deixou de ser válida (foi
// desativada, ou excluída — nesse caso a FK já vira null via onDelete: SetNull), NÃO
// reatribui sozinho: trocar de propriedade sem ação direta do usuário é arriscado
// (pode levar a cadastros/consultas na fazenda errada). Fica sem seleção até o
// usuário escolher manualmente entre as opções ainda disponíveis.
export async function getOrAssignCurrentProperty(userId: string): Promise<CurrentPropertyOption | null> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { currentProperty: { select: { id: true, name: true, deactivatedAt: true } } },
  });

  // A linha de settings só existe se o usuário já teve uma seleção (manual ou
  // automática) em algum momento — ou seja, isto NÃO é o primeiro acesso.
  if (settings) {
    if (settings.currentProperty && !settings.currentProperty.deactivatedAt) {
      return settings.currentProperty;
    }

    if (settings.currentProperty?.deactivatedAt) {
      await prisma.userSettings.update({ where: { userId }, data: { currentPropertyId: null } });
    }

    return null;
  }

  // Primeiro acesso: nunca houve seleção nem linha de settings — atribui a propriedade
  // ativa mais antiga automaticamente.
  const oldest = await prisma.property.findFirst({
    where: { deactivatedAt: null },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  if (!oldest) return null;

  await prisma.userSettings.create({ data: { userId, currentPropertyId: oldest.id } });

  return oldest;
}
