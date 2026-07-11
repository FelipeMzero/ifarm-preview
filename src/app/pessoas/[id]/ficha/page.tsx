"use client";

import { use } from "react";
import PersonDetails from "../../PersonDetails";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="flex justify-center p-8">
      <PersonDetails id={id} />
    </div>
  );
}
