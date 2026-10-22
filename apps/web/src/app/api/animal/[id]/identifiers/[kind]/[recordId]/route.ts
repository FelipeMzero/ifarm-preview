import { NextRequest, NextResponse } from "next/server";
import { identifierCorrectionSchemaFor } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  cancelIdentifier,
  correctIdentifier,
  isIdentifierKind,
} from "@/server/animal/identifiers";
import { errorResponse, validationErrorResponse } from "../../../../../http";

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

  try {
    const { id, kind, recordId } = await params;
    if (!isIdentifierKind(kind)) return notFound();

    const validation = identifierCorrectionSchemaFor(kind).safeParse(
      await request.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    await correctIdentifier(kind, id, recordId, validation.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

// Exclusão lógica: o registro sai do histórico e o identificador atual é recalculado.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id, kind, recordId } = await params;
    if (!isIdentifierKind(kind)) return notFound();

    await cancelIdentifier(kind, id, recordId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
