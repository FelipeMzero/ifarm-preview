import { lazyComponent } from "@/lib/lazy";
import { Loader2 } from "lucide-react";

const AreaMap = lazyComponent(
  () => import("@/features/area/AreaMap").then((m) => m.AreaMap),
  {
    loading: () => (
      <div className="flex h-full items-center justify-center gap-2 bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">
          Carregando mapa...
        </span>
      </div>
    ),
  },
);

export default function Page() {
  return <AreaMap />;
}
