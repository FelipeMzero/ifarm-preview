import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { uniqueConstraintErrors } from "../../dbErrors";
import { pessoaApiSchema } from "../../schemas";
import { buildEnderecoWrite } from "../helpers";



export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession({ forbiddenRoles: ["tecnico"] });
  if (response) return response;

  const { id } = await params;

  try {
    const pessoa = await prisma.pessoa.findUnique({ where: { id }, include: { endereco: true } });

    if (!pessoa || pessoa.excluidoEm) {
      return NextResponse.json({ message: "Pessoa não encontrada." }, { status: 404 });
    }

    return NextResponse.json({
      tipo:              pessoa.tipo,
      documento:         pessoa.documento,
      nome:              pessoa.nome,
      inscricaoEstadual: pessoa.inscricaoEstadual ?? "",
      telefone:          pessoa.telefone ?? "",
      email:             pessoa.email ?? "",
      nomeFantasia:      pessoa.nomeFantasia ?? "",
      rg:                pessoa.rg ?? "",
      dataNascimento:    pessoa.dataNascimento?.toISOString().slice(0, 10) ?? "",
      estadoCivil:       pessoa.estadoCivil ?? "",
      cep:               pessoa.endereco?.cep ?? "",
      logradouro:        pessoa.endereco?.logradouro ?? "",
      numero:            pessoa.endereco?.numero ?? "",
      complemento:       pessoa.endereco?.complemento ?? "",
      bairro:            pessoa.endereco?.bairro ?? "",
      municipio:         pessoa.endereco?.municipio ?? "",
      uf:                pessoa.endereco?.uf ?? "",
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}



export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession({ forbiddenRoles: ["tecnico"] });
  if (response) return response;

  const { id } = await params;

  try {
    const body = await request.json();
    const validation = pessoaApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    // `tipo` e `documento` são imutáveis após o cadastro (RF-PESSOA-02): omitidos do update.
    const {
      nome, inscricaoEstadual, telefone, email, nomeFantasia, rg, dataNascimento, estadoCivil,
      cep, logradouro, numero, complemento, bairro, municipio, uf,
    } = validation.data;

    const enderecoData = cep && logradouro && municipio && uf
      ? { cep, logradouro, numero, complemento, bairro, municipio, uf, pais: "Brasil" }
      : null;

    const atual = await prisma.pessoa.findUnique({ where: { id }, select: { enderecoId: true } });

    if (!atual) {
      return NextResponse.json({ success: false, message: "Pessoa não encontrada." }, { status: 404 });
    }

    const pessoa = await prisma.pessoa.update({
      where: { id },
      data: {
        nome, inscricaoEstadual, telefone, email, nomeFantasia, rg, dataNascimento, estadoCivil,
        ...buildEnderecoWrite(enderecoData, atual.enderecoId),
      },
    });

    return NextResponse.json({ success: true, data: pessoa });

  } catch (error) {
    const errors = uniqueConstraintErrors(error);
    if (errors) {
      return NextResponse.json({ success: false, errors }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}



export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession({ forbiddenRoles: ["tecnico"] });
  if (response) return response;

  const { id } = await params;

  try {
    // Soft-delete (RN-PESSOA-03): preserva o registro em vez de apagá-lo.
    await prisma.pessoa.update({ where: { id }, data: { excluidoEm: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}



export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession({ forbiddenRoles: ["tecnico"] });
  if (response) return response;

  const { id } = await params;

  try {
    const pessoa = await prisma.pessoa.findUnique({ where: { id }, select: { desativadoEm: true } });

    if (!pessoa) {
      return NextResponse.json({ message: "Pessoa não encontrada." }, { status: 404 });
    }

    const atualizada = await prisma.pessoa.update({
      where: { id },
      data: { desativadoEm: pessoa.desativadoEm ? null : new Date() },
    });

    return NextResponse.json({ success: true, data: atualizada });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}
