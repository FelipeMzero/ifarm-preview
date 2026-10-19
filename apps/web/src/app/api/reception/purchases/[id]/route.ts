import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  receptionPurchaseInclude,
  toReceptionPurchaseDto,
} from "@/server/reception/shared";

// Uma compra vista pela área de recepções: categorias com recebidos/esperados e as
// recepções (viagens), sem valores.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.recepcoes);
  if (response) return response;

  const { id } = await params;

  try {
    const event = await prisma.purchaseEvent.findUnique({
      where: { id },
      include: receptionPurchaseInclude,
    });
    if (!event) {
      return NextResponse.json(
        { message: "Compra não encontrada." },
        { status: 404 },
      );
    }
    return NextResponse.json(toReceptionPurchaseDto(event));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
