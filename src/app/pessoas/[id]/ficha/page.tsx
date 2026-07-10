"use client";

import { use } from "react";
import PessoaFicha from "../../PessoaFicha";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="flex justify-center p-8">
      <PessoaFicha id={id} />
    </div>
  );
}
