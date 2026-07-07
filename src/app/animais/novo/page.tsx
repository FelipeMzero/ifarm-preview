"use client";

import { useRouter } from "next/navigation";
import AnimalForm from "../AnimalForm";

export default function Page() {
  const router = useRouter();

  return (
    <div className="w-full justify-center p-8">
      <AnimalForm
        title="Novo Animal"
        onCancel={() => router.back()}
        onSuccess={(newId) => router.replace(`/animais/${newId}`)}
      />
    </div>
  );
}
