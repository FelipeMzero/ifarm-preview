import { NextResponse } from "next/server";
import { requireSession } from "@/app/api/session";
import { getCurrentPropertyDetails } from "@ifarm/domain/current-property/queries";
import { errorResponse } from "../../../http";

// Detalhes da propriedade atualmente selecionada, para exibição no painel. Sem
// restrição de papel: qualquer usuário logado precisa ver em qual propriedade está.
export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const data = await getCurrentPropertyDetails(session.user.id);
    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}
