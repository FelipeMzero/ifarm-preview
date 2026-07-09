import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uniqueConstraintErrors } from "../dbErrors";
import { pessoaApiSchema, pessoaQuerySchema } from "../schemas";



export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validation = pessoaQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!validation.success) {
      return NextResponse.json({ message: "Parâmetros inválidos." }, { status: 400 });
    }

    const { page, pageSize, search, tipo } = validation.data;

    const where = {
      ...(search ? {
        OR: [
          { nome:      { contains: search, mode: "insensitive" as const } },
          { documento: { contains: search, mode: "insensitive" as const } },
        ],
      } : {}),
      ...(tipo ? { tipo } : {}),
    };

    const [pessoas, total] = await Promise.all([
      prisma.pessoa.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: page * pageSize,
        take: pageSize,
      }),
      prisma.pessoa.count({ where }),
    ]);

    return NextResponse.json({
      data: pessoas.map((p) => ({
        id:        p.id,
        tipo:      p.tipo,
        documento: p.documento,
        nome:      p.nome,
        telefone:  p.telefone,
        email:     p.email,
        deletedAt: p.deletedAt?.toISOString() ?? null,
        updatedAt: p.updatedAt.toISOString(),
      })),
      total,
      pageCount: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}



export async function POST(request: NextRequest) {
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

    const { cep, logradouro, numero, complemento, bairro, municipio, uf, ...pessoaData } = validation.data;

    const pessoa = await prisma.pessoa.create({
      data: {
        ...pessoaData,
        ...(cep && logradouro && municipio && uf ? {
          endereco: { create: { cep, logradouro, numero, complemento, bairro, municipio, uf, pais: "Brasil" } },
        } : {}),
      },
    });

    return NextResponse.json({ success: true, data: pessoa }, { status: 201 });

  } catch (error) {
    const errors = uniqueConstraintErrors(error);
    if (errors) {
      return NextResponse.json({ success: false, errors }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}
