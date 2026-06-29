import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { animalApiSchema } from "@/app/animal/schema";



export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page     = Math.max(0, Number(searchParams.get("page")     ?? 0));
    const pageSize = Math.max(1, Number(searchParams.get("pageSize") ?? 10));
    const search   = searchParams.get("search")?.trim() ?? "";
    const status   = searchParams.get("status")?.trim() ?? "";
    const sexo     = searchParams.get("sexo")?.trim() ?? "";

    const where = {
      ...(search ? {
        OR: [
          { brinco:       { contains: search, mode: "insensitive" as const } },
          { rfid:         { contains: search, mode: "insensitive" as const } },
          { nome_apelido: { contains: search, mode: "insensitive" as const } },
        ],
      } : {}),
      ...(status ? { status: status as any } : {}),
      ...(sexo ? { sexo: sexo as any } : {}),
    };

    const [animais, total] = await Promise.all([
      prisma.animal.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: page * pageSize,
        take: pageSize,
      }),
      prisma.animal.count({ where }),
    ]);

    return NextResponse.json({
      data: animais.map((a) => ({
        id:                 a.id,
        rfid:               a.rfid,
        brinco:             a.brinco,
        nome_apelido:       a.nome_apelido,
        sexo:               a.sexo,
        data_nascimento:    a.data_nascimento?.toISOString().slice(0, 10) ?? null,
        peso_nascimento_kg: a.peso_nascimento_kg,
        origem:             a.origem,
        status:             a.status,
        peso_atual_kg:      a.peso_atual_kg,
        updatedAt:          a.updatedAt.toISOString(),
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

    const validation = animalApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const animal = await prisma.animal.create({ data: validation.data });

    return NextResponse.json({ success: true, data: animal }, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Ocorreu um erro interno no servidor." }, { status: 500 });
  }
}
