"use client";

import { use } from "react";
import { RegistrationBoard } from "@/features/management-session/RegistrationBoard";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="flex justify-center p-8">
      <RegistrationBoard id={id} />
    </div>
  );
}
