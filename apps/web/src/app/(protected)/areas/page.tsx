"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const AreaMap = dynamic(() => import("@/features/area/AreaMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100vh-64px)] items-center justify-center gap-2 bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Carregando mapa...</span>
    </div>
  ),
});

export default function Page() {
  return <AreaMap />;
}
