import { NextResponse } from "next/server";
import { requireSession } from "@/app/api/session";
import { listPropertyOptions } from "@ifarm/domain/property/queries";
import { errorResponse } from "../../http";

// Lista enxuta de propriedades para o seletor de "propriedade atual" (troca de contexto).
// Sem restrição de papel: mesmo quem não pode gerenciar propriedades precisa escolher
// em qual está trabalhando.
export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  try {
    return NextResponse.json({ data: await listPropertyOptions() });
  } catch (error) {
    return errorResponse(error);
  }
}
