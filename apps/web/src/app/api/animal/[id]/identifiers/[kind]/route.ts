import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  addIdentifier,
  isIdentifierKind,
  listIdentifiers,
} from "../../../identifiers";

// Histórico válido (não excluído) de brincos ou RFIDs do animal, do mais recente
// para o mais antigo.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; kind: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id, kind } = await params;
  if (!isIdentifierKind(kind)) {
    return NextResponse.json({ message: "Não encontrado." }, { status: 404 });
  }

  return listIdentifiers(kind, id);
}

// Troca (ou remove, com value vazio) o identificador na hora.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; kind: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id, kind } = await params;
  if (!isIdentifierKind(kind)) {
    return NextResponse.json({ message: "Não encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  return addIdentifier(kind, id, body);
}
