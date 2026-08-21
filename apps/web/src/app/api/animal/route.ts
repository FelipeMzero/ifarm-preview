import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { uniqueConstraintErrors } from "../dbErrors";
import { animalApiSchema, animalQuerySchema } from "../schemas";

export async function GET(request: NextRequest) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const validation = animalQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );

    if (!validation.success) {
      return NextResponse.json(
        { message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    const { page, pageSize, search, status, sex } = validation.data;

    const where = {
      ...(search
        ? {
            OR: [
              { earTag: { contains: search, mode: "insensitive" as const } },
              { rfid: { contains: search, mode: "insensitive" as const } },
              { name: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
      ...(sex ? { sex } : {}),
    };

    const [animals, total] = await Promise.all([
      prisma.animal.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: page * pageSize,
        take: pageSize,
      }),
      prisma.animal.count({ where }),
    ]);

    return NextResponse.json({
      data: animals.map((a) => ({
        id: a.id,
        earTag: a.earTag,
        rfid: a.rfid,
        name: a.name,
        sex: a.sex,
        birthDate: a.birthDate?.toISOString().slice(0, 10) ?? null,
        birthWeightKg: a.birthWeightKg?.toNumber() ?? null,
        origin: a.origin,
        status: a.status,
        currentWeightKg: a.currentWeightKg?.toNumber() ?? null,
        updatedAt: a.updatedAt.toISOString(),
      })),
      total,
      pageCount: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

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
    const errors = uniqueConstraintErrors(error);
    if (errors) {
      return NextResponse.json({ success: false, errors }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json(
      { success: false, message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
