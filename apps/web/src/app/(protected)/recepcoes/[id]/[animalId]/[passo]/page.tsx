"use client";

import { use } from "react";
import { AnimalStepPage } from "@/features/management-session/AnimalStepPage";

// Mesmas telas de etapa do registro de manejo, voltando para a lista da recepção.
export default function Page({
  params,
}: {
  params: Promise<{ id: string; animalId: string; passo: string }>;
}) {
  const { id, animalId, passo } = use(params);

  return (
    <div className="flex justify-center p-8">
      <AnimalStepPage
        sessionId={id}
        animalId={animalId}
        step={Number(passo) || 1}
        boardPath={`/recepcoes/${id}`}
      />
    </div>
  );
}
