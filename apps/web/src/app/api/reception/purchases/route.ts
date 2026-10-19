import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { getOrAssignCurrentProperty } from "@/server/current-property/queries";
import {
  isPending,
  receptionPurchaseInclude,
  toReceptionPurchaseDto,
} from "../shared";

const querySchema = z.object({
  propertyId: z.uuid().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  // "pending" = a receber (padrão); "all" = todas as não canceladas.
  filter: z.enum(["pending", "all"]).optional().default("pending"),
});

// Compras da propriedade vistas pela área de recepções (sem valores).
export async function GET(request: NextRequest) {
  const { response, session } = await requireSession(RESOURCE_ACCESS.recepcoes);
  if (response) return response;

  try {
    const query = querySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!query.success) {
      return NextResponse.json(
        { message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }
    const { page, pageSize, search, filter } = query.data;

    const propertyId =
      query.data.propertyId ??
      (await getOrAssignCurrentProperty(session.user.id))?.id;
    if (!propertyId) {
      return NextResponse.json({ data: [], total: 0, pageCount: 0 });
    }

    // "A receber" depende das contagens: filtra depois de montar (volume pequeno).
    const events = await prisma.purchaseEvent.findMany({
      where: {
        destinationPropertyId: propertyId,
        cancelledAt: null,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { seller: { name: { contains: search, mode: "insensitive" } } },
                {
                  receptions: {
                    some: {
                      gtaNumber: { contains: search, mode: "insensitive" },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: receptionPurchaseInclude,
      orderBy: [{ purchaseDate: "desc" }, { createdAt: "desc" }],
    });

    const all = events.map(toReceptionPurchaseDto);
    const rows = filter === "pending" ? all.filter(isPending) : all;

    return NextResponse.json({
      data: rows.slice(page * pageSize, (page + 1) * pageSize),
      total: rows.length,
      page,
      pageSize,
      pageCount: Math.ceil(rows.length / pageSize),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
