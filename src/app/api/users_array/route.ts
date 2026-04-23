/*
API route usando array como base de dados
*/

import { NextResponse } from "next/server";

let users = [
    { id: 1, name: "fulado"},
    { id: 2, name: "ciclano"},
];

let lastID = 2;

export async function GET() {
    return NextResponse.json(users);
}

export async function POST(request: Request) {
    const { name }  = await request.json();
    const user = users.find( (user) => user.name === name );

    if (user) {
        return NextResponse.json( {msg: "Usuário já existe"}, {status: 400} );
    }
    lastID += 1;
    users.push( {id: lastID, name} );
    return NextResponse.json( {msg: "Usuário criado com sucesso!"} );
}

export async function DELETE( request: Request ) {
    const { id } = await request.json();
    const numberID = Number(id);

    const user = users.find( (user) => user.id === numberID );
    if (!user) {
        return NextResponse.json( 
            {msg: "Usuário não existe!"},
            {status: 404}
        );
    }

    users = users.filter( (user)=> user.id !== numberID );
    return NextResponse.json( {msg: 'Usuário deletado!' } );
}

export async function PUT( request: Request ) {
    const { id, name } = await request.json();
    const numberID = Number(id);
    const user = users.find( (user) => user.id === numberID);
    if (!user) {
        return NextResponse.json(
            {msg: "Usuário não existe!"},
            {status: 404}
        );
    }

    user.name = name;
    return NextResponse.json( {msg: "Usuário editado com sucesso"} );

}