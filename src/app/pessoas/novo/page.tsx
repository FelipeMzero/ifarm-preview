"use client";

import { useRouter } from "next/navigation";
import PessoaForm from "../PessoaForm";

export default function Page() {
  const router = useRouter();

  return (
    <div className="w-full justify-center p-8">
      <PessoaForm
        title="Nova Pessoa"
        onCancel={() => router.back()}
        onSuccess={(newId) => router.replace(`/pessoas/${newId}`)}
      />
    </div>
  );
}
