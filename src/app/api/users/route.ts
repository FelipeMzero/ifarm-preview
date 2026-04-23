import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const users = await prisma.user.findMany();
    return NextResponse.json( users );
}

export async function POST(request: Request) {
    const {name, email} = await request.json();
    if (!name || !email) {
        return NextResponse.json(
            {msg: "Usuário inválido! Nome e e-mail são obrigatórios!"},
            {status: 400}
        );
    }

    const user = await prisma.user.findUnique( {where: {email: email} } );
    if (user) {
        return NextResponse.json(
            {msg: "Usuário já existe"},
            {status: 400}
        );
    }

    await prisma.user.create({
        data: {
            name, email
        } 
    });
    return NextResponse.json({msg: "Usuário criado com sucesso!"});
}