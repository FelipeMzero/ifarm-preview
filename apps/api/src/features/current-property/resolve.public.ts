import type { BrTimeZone, CurrentProperty } from "@ifarm/shared";
import { prisma } from "@ifarm/db";

// Propriedade atual do usuário: a preferência que o web usa para escolher a propriedade das
// telas (o seletor do menu). As listagens e os cadastros recebem sempre o `propertyId`.
//
// Se o usuário nunca teve uma propriedade selecionada, assume automaticamente a
// propriedade ativa mais antiga cadastrada, sem exigir escolha manual no primeiro
// acesso. Mas se ele já tinha uma seleção válida e ela deixou de ser válida (foi
// desativada, ou excluída — nesse caso a FK já vira null via onDelete: SetNull), NÃO
// reatribui sozinho: trocar de propriedade sem ação direta do usuário é arriscado
// (pode levar a cadastros/consultas na fazenda errada). Fica sem seleção até o
// usuário escolher manualmente entre as opções ainda disponíveis.
// O fuso gravado é sempre um dos fusos do Brasil (propertySchema) ou o padrão do banco.
export const withTimeZone = <T extends { timeZone: string }>(property: T) => ({
  ...property,
  timeZone: property.timeZone as BrTimeZone,
});

export async function getOrAssignCurrentProperty(
  userId: string,
): Promise<CurrentProperty | null> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: {
      currentProperty: {
        select: { id: true, name: true, timeZone: true, deactivatedAt: true },
      },
    },
  });

  // A linha de settings só existe se o usuário já teve uma seleção (manual ou
  // automática) em algum momento — ou seja, isto NÃO é o primeiro acesso.
  if (settings) {
    if (settings.currentProperty && !settings.currentProperty.deactivatedAt) {
      return withTimeZone(settings.currentProperty);
    }

    if (settings.currentProperty?.deactivatedAt) {
      await prisma.userSettings.update({
        where: { userId },
        data: { currentPropertyId: null },
      });
    }

    return null;
  }

  // Primeiro acesso: nunca houve seleção nem linha de settings — atribui a propriedade
  // ativa mais antiga automaticamente.
  const oldest = await prisma.property.findFirst({
    where: { deactivatedAt: null },
    select: { id: true, name: true, timeZone: true },
    orderBy: { createdAt: "asc" },
  });

  if (!oldest) return null;

  await prisma.userSettings.create({
    data: { userId, currentPropertyId: oldest.id },
  });

  return withTimeZone(oldest);
}
