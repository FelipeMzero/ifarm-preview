"use client";

import { Construction } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Page() {
  const router = useRouter();

  return (
    <div className="flex min-h-100 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="rounded-full bg-muted p-4">
        <Construction className="h-10 w-10 text-muted-foreground" />
      </div>

      <div>
        <h2 className="text-xl font-semibold">Em construção</h2>
        <p className="mt-2 text-muted-foreground">
          A edição de animais ainda está sendo desenvolvida.
        </p>
      </div>

      <Button onClick={() => router.push("/animais")} className="w-40">
        Voltar para a lista
      </Button>
    </div>
  );
}
