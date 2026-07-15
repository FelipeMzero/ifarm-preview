import { prisma } from "@/lib/prisma";

export type CurrentPropertyOption = {
  id: string;
  name: string;
};

// Se o usuário ainda não tiver uma propriedade selecionada (ou a selecionada foi
// removida), assume automaticamente a propriedade mais antiga cadastrada, sem exigir
// escolha manual no primeiro acesso.
export async function getOrAssignCurrentProperty(userId: string): Promise<CurrentPropertyOption | null> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { currentProperty: { select: { id: true, name: true } } },
  });

  // Se a propriedade selecionada tiver sido excluída, a FK já virou null automaticamente
  // (onDelete: SetNull); uma propriedade apenas inativada continua sendo uma seleção válida.
  if (settings?.currentProperty) {
    return settings.currentProperty;
  }

  const oldest = await prisma.property.findFirst({
    where: { deactivatedAt: null },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  if (!oldest) return null;

  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, currentPropertyId: oldest.id },
    update: { currentPropertyId: oldest.id },
  });

  return oldest;
}
