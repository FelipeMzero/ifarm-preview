import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  cancelIdentifier,
  correctIdentifier,
  isIdentifierKind,
} from "../../../../identifiers";

type Params = {
  params: Promise<{ id: string; kind: string; recordId: string }>;
};

const notFound = () =>
  NextResponse.json(
    { success: false, message: "Não encontrado." },
    { status: 404 },
  );

// Corrige valor, data (só registros avulsos) e observação de um brinco/RFID.
export async function PATCH(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id, kind, recordId } = await params;
  if (!isIdentifierKind(kind)) return notFound();

  const body = await request.json().catch(() => ({}));
  return correctIdentifier(kind, id, recordId, body);
}

// Exclusão lógica: o registro sai do histórico e o identificador atual é recalculado.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id, kind, recordId } = await params;
  if (!isIdentifierKind(kind)) return notFound();

  return cancelIdentifier(kind, id, recordId);
}
