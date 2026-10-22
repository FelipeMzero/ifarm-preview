import { NextRequest, NextResponse } from "next/server";
import { identifierChangeSchemaFor } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { CommitmentError } from "@/server/animal/commitments";
import {
  addIdentifier,
  isIdentifierKind,
  listIdentifiers,
} from "@/server/animal/identifiers";
import { errorResponse, validationErrorResponse } from "../../../../http";

type Params = { params: Promise<{ id: string; kind: string }> };

const notFound = () =>
  NextResponse.json({ message: "Não encontrado." }, { status: 404 });

// Histórico válido (não excluído) de brincos ou RFIDs do animal, do mais recente
// para o mais antigo.
export async function GET(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id, kind } = await params;
    if (!isIdentifierKind(kind)) return notFound();
    return NextResponse.json(await listIdentifiers(kind, id));
  } catch (error) {
    return errorResponse(error);
  }
}

// Troca (ou remove, com value vazio) o identificador na hora.
export async function POST(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id, kind } = await params;
    if (!isIdentifierKind(kind)) return notFound();

    const validation = identifierChangeSchemaFor(kind).safeParse(
      await request.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    await addIdentifier(kind, id, validation.data);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    // Conflito de compromisso aparece só como mensagem, sem campo do formulário.
    return errorResponse(
      error,
      error instanceof CommitmentError ? { field: null } : {},
    );
  }
}
