"use client";

import { use } from "react";
import { ReceptionBoard } from "@/features/reception/ReceptionBoard";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="flex justify-center p-8">
      <ReceptionBoard id={id} />
    </div>
  );
}
